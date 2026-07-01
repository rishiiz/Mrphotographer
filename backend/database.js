import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mrphotographer',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection()
  .then(conn => {
    console.log('Connected to MySQL database');
    conn.release();
  })
  .catch(err => {
    console.error('MySQL connection error:', err.message);
  });

export const parseJsonField = (value, fallback = []) => {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const runQuery = async (sql, params = []) => {
  const [result] = await pool.execute(sql, params);

  // INSERT / UPDATE / DELETE
  if (result.insertId !== undefined) {
    return {
      lastID: result.insertId || null,
      rowCount: result.affectedRows,
      rows: [],
    };
  }

  // SELECT
  return {
    lastID: null,
    rowCount: result.length,
    rows: result,
  };
};

export const allQuery = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

export const getQuery = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
};


export const initDb = async () => {
  console.log('Initializing MySQL tables...');

  await runQuery(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role ENUM('client', 'photographer', 'admin') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS photographer_profiles (
      user_id INT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      bio TEXT,
      phone VARCHAR(20),
      address TEXT,
      city VARCHAR(100) NOT NULL DEFAULT 'Pune',
      lat DOUBLE,
      lng DOUBLE,
      price_per_hour DECIMAL(10,2) NOT NULL,
      rating DECIMAL(2,1) DEFAULT 5.0,
      specialties TEXT,
      gear TEXT,
      profile_photo TEXT,
      portfolio JSON,
      is_approved TINYINT(1) DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS photographer_portfolio (
      id INT AUTO_INCREMENT PRIMARY KEY,
      photographer_id INT NOT NULL UNIQUE,
      profile_pic TEXT,
      portfolio_images JSON,
      portfolio_video TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (photographer_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS packages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      photographer_id INT,
      type VARCHAR(20) NOT NULL,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      duration_hours INT NOT NULL,
      features JSON,
      is_active TINYINT(1) DEFAULT 1,
      FOREIGN KEY (photographer_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      client_id INT,
      photographer_id INT,
      package_id INT,
      booking_date DATE NOT NULL,
      time_slot VARCHAR(50) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      notes TEXT,
      total_price DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_booking (photographer_id, booking_date, time_slot),
      FOREIGN KEY (client_id) REFERENCES users(id),
      FOREIGN KEY (photographer_id) REFERENCES users(id),
      FOREIGN KEY (package_id) REFERENCES packages(id)
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id INT UNIQUE,
      client_id INT,
      photographer_id INT,
      rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (client_id) REFERENCES users(id),
      FOREIGN KEY (photographer_id) REFERENCES users(id)
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS availability (
      id INT AUTO_INCREMENT PRIMARY KEY,
      photographer_id INT,
      date DATE NOT NULL,
      slots JSON NOT NULL,
      UNIQUE KEY unique_avail (photographer_id, date),
      FOREIGN KEY (photographer_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_id INT,
      razorpay_order_id VARCHAR(100),
      razorpay_payment_id VARCHAR(100),
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'INR',
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    )
  `);

  console.log('Database tables created successfully.');
};

export default pool;
