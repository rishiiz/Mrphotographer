import express from 'express';
import { runQuery, getQuery } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, async (req, res, next) => {
  const { bookingId, rating, comment } = req.body;
  const clientId = req.user.id;

  if (!bookingId || !rating) {
    return res.status(400).json({ error: 'Booking ID and star rating are required' });
  }

  const numericRating = parseInt(rating);
  if (numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  }

  try {
    const booking = await getQuery(
      'SELECT * FROM bookings WHERE id = ? AND client_id = ?',
      [bookingId, clientId]
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or not owned by you' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'You can only review completed sessions' });
    }

    const existingReview = await getQuery('SELECT id FROM reviews WHERE booking_id = ?', [bookingId]);
    if (existingReview) {
      return res.status(400).json({ error: 'This booking has already been reviewed' });
    }

    await runQuery(
      'INSERT INTO reviews (booking_id, client_id, photographer_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [bookingId, clientId, booking.photographer_id, numericRating, comment || '']
    );

    const avgRes = await getQuery(
      'SELECT AVG(rating) as avg_rating FROM reviews WHERE photographer_id = ?',
      [booking.photographer_id]
    );

    const newAvg = parseFloat(avgRes.avg_rating || 5.0).toFixed(1);

    await runQuery(
      'UPDATE photographer_profiles SET rating = ? WHERE user_id = ?',
      [newAvg, booking.photographer_id]
    );

    res.status(201).json({
      message: 'Review posted successfully',
      newAverageRating: newAvg
    });
  } catch (error) {
    next(error);
  }
});

export default router;
