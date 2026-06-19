import express from 'express';
import bcrypt from 'bcryptjs';
import { runQuery, getQuery, parseJsonField } from '../database.js';
import { signToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const PUNE_COORDS = { lat: 18.472, lng: 73.942 };

router.post('/register', async (req, res, next) => {
  const { email, password, role, name, city, pricePerHour, specialties } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }

  if (!['client', 'photographer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be client or photographer' });
  }

  try {
    const existingUser = await getQuery('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRes = await runQuery(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email, passwordHash, role]
    );
    const userId = userRes.lastID;

    if (role === 'photographer') {
      const pName = name || 'New Photographer';
      const pCity = city || 'Pune';
      const pPrice = pricePerHour || 2000;
      const pSpecs = specialties || 'Portrait';

      await runQuery(`
        INSERT INTO photographer_profiles
        (user_id, name, bio, city, lat, lng, price_per_hour, rating, specialties, gear, portfolio, is_approved)
        VALUES (?, ?, ?, ?, ?, ?, ?, 5.0, ?, ?, ?, false)
      `, [
        userId,
        pName,
        'Newly registered photographer profile in Pune.',
        pCity,
        PUNE_COORDS.lat,
        PUNE_COORDS.lng,
        pPrice,
        pSpecs,
        'Camera body, Standard lens',
        JSON.stringify([])
      ]);

      await runQuery(`
        INSERT INTO packages (photographer_id, type, name, price, duration_hours, features)
        VALUES (?, 'basic', 'Mini Session', ?, 1, ?)
      `, [userId, pPrice, JSON.stringify(['1-hour shoot', '10 edited photos'])]);

      await runQuery(`
        INSERT INTO packages (photographer_id, type, name, price, duration_hours, features)
        VALUES (?, 'standard', 'Standard Shoot', ?, 3, ?)
      `, [userId, Math.round(pPrice * 2.5), JSON.stringify(['3-hour shoot', '30 edited photos', '1 location'])]);

      await runQuery(`
        INSERT INTO packages (photographer_id, type, name, price, duration_hours, features)
        VALUES (?, 'premium', 'Deluxe Shoot', ?, 6, ?)
      `, [userId, Math.round(pPrice * 4.5), JSON.stringify(['6-hour shoot', '60 edited photos', 'Multiple locations'])]);
    }

    const token = signToken({ id: userId, email, role });
    res.status(201).json({
      token,
      user: { id: userId, email, role }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await getQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await getQuery('SELECT id, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let profile = null;
    if (user.role === 'photographer') {
      profile = await getQuery('SELECT * FROM photographer_profiles WHERE user_id = ?', [user.id]);
      if (profile) {
        profile.portfolio = parseJsonField(profile.portfolio, []);
        profile.is_approved = !!profile.is_approved;
        profile.price_per_hour = parseFloat(profile.price_per_hour);
        profile.rating = parseFloat(profile.rating);
      }
    }

    res.json({ user, profile });
  } catch (error) {
    next(error);
  }
});

export default router;
