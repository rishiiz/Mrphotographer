import express from 'express';
import { allQuery, getQuery, runQuery, parseJsonField } from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res, next) => {
  const { id, role } = req.user;

  try {
    let query = '';
    let params = [];

    if (role === 'client') {
      query = `
        SELECT b.*, p.name as photographer_name, p.city as photographer_city, pkg.name as package_name, pkg.duration_hours
        FROM bookings b
        JOIN photographer_profiles p ON b.photographer_id = p.user_id
        JOIN packages pkg ON b.package_id = pkg.id
        WHERE b.client_id = ?
        ORDER BY b.booking_date DESC, b.time_slot DESC
      `;
      params = [id];
    } else if (role === 'photographer') {
      query = `
        SELECT b.*, u.email as client_email, pkg.name as package_name, pkg.duration_hours
        FROM bookings b
        JOIN users u ON b.client_id = u.id
        JOIN packages pkg ON b.package_id = pkg.id
        WHERE b.photographer_id = ?
        ORDER BY b.booking_date DESC, b.time_slot DESC
      `;
      params = [id];
    } else if (role === 'admin') {
      query = `
        SELECT b.*, u.email as client_email, p.name as photographer_name, pkg.name as package_name
        FROM bookings b
        JOIN users u ON b.client_id = u.id
        JOIN photographer_profiles p ON b.photographer_id = p.user_id
        JOIN packages pkg ON b.package_id = pkg.id
        ORDER BY b.created_at DESC
      `;
    }

    const bookings = await allQuery(query, params);
    res.json(bookings.map(b => ({ ...b, total_price: parseFloat(b.total_price) })));
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticateToken, async (req, res, next) => {
  const { photographerId, packageId, date, timeSlot, notes } = req.body;
  const clientId = req.user.id;

  if (!photographerId || !packageId || !date || !timeSlot) {
    return res.status(400).json({ error: 'Photographer, package, date, and slot are required' });
  }

  try {
    const avail = await getQuery(
      'SELECT slots FROM availability WHERE photographer_id = ? AND date = ?',
      [photographerId, date]
    );

    if (!avail) {
      return res.status(400).json({ error: 'Photographer has no availability on this date' });
    }

    const slots = parseJsonField(avail.slots, []);
    if (!slots.includes(timeSlot)) {
      return res.status(400).json({ error: 'Selected time slot is no longer available' });
    }

    const pkg = await getQuery('SELECT price FROM packages WHERE id = ?', [packageId]);
    if (!pkg) {
      return res.status(404).json({ error: 'Selected package not found' });
    }

    const bookingRes = await runQuery(`
      INSERT INTO bookings (client_id, photographer_id, package_id, booking_date, time_slot, status, notes, total_price)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `, [clientId, photographerId, packageId, date, timeSlot, notes, pkg.price]);

    const updatedSlots = slots.filter(s => s !== timeSlot);
    await runQuery(
      'UPDATE availability SET slots = ? WHERE photographer_id = ? AND date = ?',
      [JSON.stringify(updatedSlots), photographerId, date]
    );

    res.status(201).json({
      message: 'Booking created successfully!',
      bookingId: bookingRes.lastID
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'This time slot is already booked' });
    }
    next(error);
  }
});

router.patch('/:id/status', authenticateToken, async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  if (!['approved', 'declined', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status update' });
  }

  try {
    const booking = await getQuery('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (role === 'photographer' && booking.photographer_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this booking' });
    }
    if (role === 'client' && booking.client_id !== userId && status !== 'completed') {
      return res.status(403).json({ error: 'Unauthorized action' });
    }

    await runQuery('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);

    if (status === 'approved') {
      const clientUser = await getQuery('SELECT email FROM users WHERE id = ?', [booking.client_id]);
      const photoProfile = await getQuery('SELECT name FROM photographer_profiles WHERE user_id = ?', [booking.photographer_id]);

      console.log(`
      [NODEMAILER EMAIL SENT]
      To: ${clientUser.email}
      Subject: Mr.Photographer Booking Confirmed!
      Body: Hi there! Your booking request with ${photoProfile.name} on ${booking.booking_date} at ${booking.time_slot} has been APPROVED.
      `);
    }

    if (status === 'declined') {
      const avail = await getQuery(
        'SELECT slots FROM availability WHERE photographer_id = ? AND date = ?',
        [booking.photographer_id, booking.booking_date]
      );
      if (avail) {
        const slots = parseJsonField(avail.slots, []);
        if (!slots.includes(booking.time_slot)) {
          slots.push(booking.time_slot);
          slots.sort();
          await runQuery(
            'UPDATE availability SET slots = ? WHERE photographer_id = ? AND date = ?',
            [JSON.stringify(slots), booking.photographer_id, booking.booking_date]
          );
        }
      } else {
        await runQuery(
          'INSERT INTO availability (photographer_id, date, slots) VALUES (?, ?, ?)',
          [booking.photographer_id, booking.booking_date, JSON.stringify([booking.time_slot])]
        );
      }
    }

    res.json({ message: `Booking status updated to ${status}` });
  } catch (error) {
    next(error);
  }
});

router.get('/availability', authenticateToken, async (req, res, next) => {
  if (req.user.role !== 'photographer') {
    return res.status(403).json({ error: 'Only photographers can access their calendar' });
  }

  try {
    const dates = await allQuery(
      'SELECT date, slots FROM availability WHERE photographer_id = ? ORDER BY date ASC',
      [req.user.id]
    );
    const parsed = dates.map(d => ({
      date: d.date,
      slots: parseJsonField(d.slots, [])
    }));
    res.json(parsed);
  } catch (error) {
    next(error);
  }
});

router.post('/availability', authenticateToken, requireRole('photographer'), async (req, res, next) => {
  const { date, slots } = req.body;
  const photographerId = req.user.id;

  if (!date || !Array.isArray(slots)) {
    return res.status(400).json({ error: 'Date and slots array are required' });
  }

  try {
    await runQuery(`
      INSERT INTO availability (photographer_id, date, slots)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE slots = VALUES(slots)
    `, [photographerId, date, JSON.stringify(slots)]);

    res.json({ message: 'Availability updated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
