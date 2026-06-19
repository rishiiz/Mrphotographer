import express from 'express';
import { allQuery, getQuery, runQuery, parseJsonField } from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function normalizeProfile(row) {
  if (!row) return row;
  row.portfolio = parseJsonField(row.portfolio, []);
  row.is_approved = !!row.is_approved;
  row.price_per_hour = parseFloat(row.price_per_hour);
  row.rating = parseFloat(row.rating);
  return row;
}

router.get('/', async (req, res, next) => {
  const { city, specialty, minPrice, maxPrice, rating, date, lat, lng, sortBy } = req.query;

  try {
    let query = `
      SELECT p.*, u.email,
        (SELECT COUNT(*) FROM reviews r WHERE r.photographer_id = p.user_id) AS review_count
      FROM photographer_profiles p
      JOIN users u ON p.user_id = u.id
      WHERE p.is_approved = true
    `;
    const params = [];

    if (city) {
      query += ` AND (p.city LIKE ? OR p.address LIKE ?)`;
      params.push(`%${city}%`, `%${city}%`);
    }

    if (minPrice) {
      query += ` AND p.price_per_hour >= ?`;
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      query += ` AND p.price_per_hour <= ?`;
      params.push(parseFloat(maxPrice));
    }

    if (rating) {
      query += ` AND p.rating >= ?`;
      params.push(parseFloat(rating));
    }

    let rows = await allQuery(query, params);
    rows = rows.map(normalizeProfile);

    if (specialty) {
      rows = rows.filter(row => {
        const specs = (row.specialties || '').split(',').map(s => s.trim().toLowerCase());
        return specs.includes(specialty.toLowerCase());
      });
    }

    if (date) {
      const availablePhotographers = await allQuery(
        'SELECT DISTINCT photographer_id FROM availability WHERE date = ? AND JSON_LENGTH(slots) > 0',
        [date]
      );
      const availableIds = availablePhotographers.map(ap => ap.photographer_id);
      rows = rows.filter(row => availableIds.includes(row.user_id));
    }

    const clientLat = parseFloat(lat);
    const clientLng = parseFloat(lng);

    rows = rows.map(row => {
      if (!isNaN(clientLat) && !isNaN(clientLng) && row.lat && row.lng) {
        row.distance = calculateDistance(clientLat, clientLng, row.lat, row.lng);
      } else {
        row.distance = null;
      }
      return row;
    });

    if (sortBy === 'nearest' && !isNaN(clientLat) && !isNaN(clientLng)) {
      rows.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    } else if (sortBy === 'highest_rated') {
      rows.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'lowest_price') {
      rows.sort((a, b) => a.price_per_hour - b.price_per_hour);
    } else if (sortBy === 'most_reviewed') {
      rows.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
    }

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const profile = await getQuery(
      'SELECT p.*, u.email FROM photographer_profiles p JOIN users u ON p.user_id = u.id WHERE p.user_id = ?',
      [id]
    );

    if (!profile) {
      return res.status(404).json({ error: 'Photographer not found' });
    }

    normalizeProfile(profile);

    const packages = await allQuery('SELECT * FROM packages WHERE photographer_id = ? AND is_active = true', [id]);
    const parsedPackages = packages.map(pkg => {
      pkg.features = parseJsonField(pkg.features, []);
      pkg.price = parseFloat(pkg.price);
      return pkg;
    });

    const reviews = await allQuery(`
      SELECT r.*, c.email as client_email, cp.name as client_name
      FROM reviews r
      JOIN users c ON r.client_id = c.id
      LEFT JOIN photographer_profiles cp ON c.id = cp.user_id
      WHERE r.photographer_id = ?
      ORDER BY r.created_at DESC
    `, [id]);

    const availability = await allQuery(
      'SELECT date, slots FROM availability WHERE photographer_id = ? AND date >= CURDATE() ORDER BY date ASC',
      [id]
    );
    const parsedAvailability = availability.map(av => {
      av.slots = parseJsonField(av.slots, []);
      return av;
    });

    res.json({
      profile,
      packages: parsedPackages,
      reviews,
      availability: parsedAvailability
    });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', authenticateToken, requireRole('photographer'), async (req, res, next) => {
  const { name, bio, city, lat, lng, price_per_hour, specialties, gear, portfolio, profile_photo, packages } = req.body;
  const photographerId = req.user.id;

  try {
    await runQuery(`
      UPDATE photographer_profiles
      SET name = ?, bio = ?, city = ?, lat = ?, lng = ?, price_per_hour = ?,
          specialties = ?, gear = ?, portfolio = ?, profile_photo = ?
      WHERE user_id = ?
    `, [
      name,
      bio,
      city,
      lat ? parseFloat(lat) : null,
      lng ? parseFloat(lng) : null,
      parseFloat(price_per_hour),
      specialties,
      gear,
      JSON.stringify(portfolio || []),
      profile_photo || null,
      photographerId
    ]);

    if (packages && Array.isArray(packages)) {
      for (const pkg of packages) {
        if (pkg.id) {
          await runQuery(`
            UPDATE packages
            SET name = ?, price = ?, duration_hours = ?, features = ?
            WHERE id = ? AND photographer_id = ?
          `, [pkg.name, parseFloat(pkg.price), parseInt(pkg.duration_hours), JSON.stringify(pkg.features || []), pkg.id, photographerId]);
        } else {
          await runQuery(`
            INSERT INTO packages (photographer_id, type, name, price, duration_hours, features)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [photographerId, pkg.type || 'standard', pkg.name, parseFloat(pkg.price), parseInt(pkg.duration_hours), JSON.stringify(pkg.features || [])]);
        }
      }
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
