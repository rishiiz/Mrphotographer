import express from 'express';
import { allQuery, runQuery, getQuery, parseJsonField } from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/photographers/pending', authenticateToken, requireRole('admin'), async (req, res, next) => {
  try {
    const list = await allQuery(`
      SELECT p.*, u.email
      FROM photographer_profiles p
      JOIN users u ON p.user_id = u.id
      WHERE p.is_approved = false
    `);
    res.json(list.map(p => ({
      ...p,
      portfolio: parseJsonField(p.portfolio, []),
      price_per_hour: parseFloat(p.price_per_hour),
    })));
  } catch (error) {
    next(error);
  }
});

router.patch('/photographers/:id/approve', authenticateToken, requireRole('admin'), async (req, res, next) => {
  const { id } = req.params;

  try {
    const profile = await getQuery('SELECT user_id FROM photographer_profiles WHERE user_id = ?', [id]);
    if (!profile) {
      return res.status(404).json({ error: 'Photographer profile not found' });
    }

    await runQuery('UPDATE photographer_profiles SET is_approved = true WHERE user_id = ?', [id]);
    res.json({ message: 'Photographer profile approved successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/photographers/:id/reject', authenticateToken, requireRole('admin'), async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await getQuery('SELECT id FROM users WHERE id = ? AND role = ?', [id, 'photographer']);
    if (!user) {
      return res.status(404).json({ error: 'Photographer user not found' });
    }

    await runQuery('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Photographer profile rejected and account deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
