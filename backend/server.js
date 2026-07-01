import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './database.js';

// Route imports
import authRoutes from './routes/auth.js';
import photographerRoutes from './routes/photographers.js';
import bookingRoutes from './routes/bookings.js';
import reviewRoutes from './routes/reviews.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Read from env for Docker, fallback to Vite default
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB init — server requires a working MySQL connection
try {
  await initDb();
} catch (error) {
  console.error('Failed to initialize database:', error.message || error);
  console.error('\nMySQL is required. Steps:');
  console.error('  1. Install MySQL and create database "mrphotographer"');
  console.error('  2. Copy backend/.env.example to backend/.env');
  console.error('  3. Set DB_PASSWORD with your MySQL password');
  console.error('  See backend/README.md for full instructions.\n');
  process.exit(1);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/photographers', photographerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`Mr.Photographer Server is running on port ${PORT}`);
});
