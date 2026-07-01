import express from 'express';
import multer from 'multer';
<<<<<<< HEAD
=======
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
>>>>>>> c43c782 (Your commit message)
import { allQuery, getQuery, runQuery, parseJsonField } from '../database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { uploadFileToR2 } from '../services/r2.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|mp4|quicktime|mov/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname || mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (JPG, PNG) and videos (MP4, MOV) are allowed'));
    }
  }
});

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
  if (row.portfolio_images !== undefined && row.portfolio_images !== null) {
    row.portfolio = parseJsonField(row.portfolio_images, []);
  } else {
    row.portfolio = parseJsonField(row.portfolio, []);
  }
  if (row.profile_pic) {
    row.profile_photo = row.profile_pic;
  }
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
        port.portfolio_images, port.portfolio_video, port.profile_pic,
        (SELECT COUNT(*) FROM reviews r WHERE r.photographer_id = p.user_id) AS review_count
      FROM photographer_profiles p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN photographer_portfolio port ON p.user_id = port.photographer_id
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
      `SELECT p.*, u.email, port.portfolio_images, port.portfolio_video, port.profile_pic
       FROM photographer_profiles p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN photographer_portfolio port ON p.user_id = port.photographer_id
       WHERE p.user_id = ?`,
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

<<<<<<< HEAD
// Setup multer with memory storage and constraints
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only image/jpeg and image/png are allowed!'), false);
    }
  },
});

const uploadMiddleware = upload.single('photo');

router.post('/upload', authenticateToken, requireRole('photographer'), (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uniqueFileName = Date.now() + req.file.originalname;

    uploadFileToR2(req.file.buffer, uniqueFileName, req.file.mimetype)
      .then(url => {
        res.json({ url });
      })
      .catch(next);
  });
});
=======
// ─── PORTFOLIO ENDPOINTS ───────────────────────────────────────────

// GET portfolio data for the logged-in photographer
router.get('/portfolio', authenticateToken, requireRole('photographer'), async (req, res, next) => {
  try {
    const row = await getQuery(
      'SELECT * FROM photographer_portfolio WHERE photographer_id = ?',
      [req.user.id]
    );
    if (!row) {
      return res.json({ profile_pic: null, portfolio_images: [], portfolio_video: null });
    }
    row.portfolio_images = parseJsonField(row.portfolio_images, []);
    res.json(row);
  } catch (error) {
    next(error);
  }
});

// POST upload portfolio files (profile pic, portfolio images, video)
router.post(
  '/portfolio/upload',
  authenticateToken,
  requireRole('photographer'),
  upload.fields([
    { name: 'profile_pic', maxCount: 1 },
    { name: 'portfolio_images', maxCount: 3 },
    { name: 'portfolio_video', maxCount: 1 }
  ]),
  async (req, res, next) => {
    const photographerId = req.user.id;
    try {
      // Fetch existing row so we can merge (keep old values for fields not re-uploaded)
      const existing = await getQuery(
        'SELECT * FROM photographer_portfolio WHERE photographer_id = ?',
        [photographerId]
      );

      // Build the values from uploads + existing data
      let profilePicUrl = existing?.profile_pic || null;
      let portfolioImages = parseJsonField(existing?.portfolio_images, []);
      let portfolioVideo = existing?.portfolio_video || null;

      if (req.files?.profile_pic?.[0]) {
        profilePicUrl = `/uploads/${req.files.profile_pic[0].filename}`;
      }

      // Handle portfolio grid state if passed to keep/delete correct images in correct slots
      if (req.body.portfolio_grid_state) {
        try {
          const gridState = JSON.parse(req.body.portfolio_grid_state);
          let fileIndex = 0;
          const newPortfolioImages = [];

          for (let i = 0; i < gridState.length; i++) {
            const val = gridState[i];
            if (val) {
              if (val.startsWith('/uploads/')) {
                newPortfolioImages.push(val);
              } else if (val.includes('/uploads/')) {
                const idx = val.indexOf('/uploads/');
                newPortfolioImages.push(val.substring(idx));
              } else if (req.files?.portfolio_images?.[fileIndex]) {
                newPortfolioImages.push(`/uploads/${req.files.portfolio_images[fileIndex].filename}`);
                fileIndex++;
              }
            }
          }
          portfolioImages = newPortfolioImages;
        } catch (e) {
          console.error('Failed to parse portfolio_grid_state', e);
          if (req.files?.portfolio_images?.length) {
            portfolioImages = req.files.portfolio_images.map(f => `/uploads/${f.filename}`);
          }
        }
      } else if (req.files?.portfolio_images?.length) {
        portfolioImages = req.files.portfolio_images.map(f => `/uploads/${f.filename}`);
      }

      if (req.files?.portfolio_video?.[0]) {
        portfolioVideo = `/uploads/${req.files.portfolio_video[0].filename}`;
      } else if (req.body.video_url !== undefined) {
        portfolioVideo = req.body.video_url || null;
      }

      // UPSERT
      if (existing) {
        await runQuery(`
          UPDATE photographer_portfolio
          SET profile_pic = ?, portfolio_images = ?, portfolio_video = ?
          WHERE photographer_id = ?
        `, [profilePicUrl, JSON.stringify(portfolioImages), portfolioVideo, photographerId]);
      } else {
        await runQuery(`
          INSERT INTO photographer_portfolio (photographer_id, profile_pic, portfolio_images, portfolio_video)
          VALUES (?, ?, ?, ?)
        `, [photographerId, profilePicUrl, JSON.stringify(portfolioImages), portfolioVideo]);
      }

      // Also update the profile_photo and portfolio columns in photographer_profiles so search/details pick it up
      await runQuery(
        'UPDATE photographer_profiles SET profile_photo = ?, portfolio = ? WHERE user_id = ?',
        [profilePicUrl, JSON.stringify(portfolioImages), photographerId]
      );

      res.json({
        message: 'Portfolio saved successfully',
        profile_pic: profilePicUrl,
        portfolio_images: portfolioImages,
        portfolio_video: portfolioVideo
      });
    } catch (error) {
      next(error);
    }
  }
);
>>>>>>> c43c782 (Your commit message)

export default router;
