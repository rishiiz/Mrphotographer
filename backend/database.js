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

const PUNE_PHOTOGRAPHERS = [
  {
    email: 'rishi.photography@mrphotographer.in',
    name: 'Rishi Photography',
    phone: '07447417225',
    address: 'D wing, Tranquility Annex, Shewalewadi, Pune, Maharashtra 412307',
    city: 'Pune',
    lat: 18.4875,
    lng: 73.958,
    price_per_hour: 2500,
    rating: 4.9,
    specialties: 'Wedding,Portrait',
    bio: 'Professional wedding and portrait photographer serving Shewalewadi and Pune. Capturing authentic moments with natural light and cinematic storytelling.',
    gear: 'Sony A7 IV, 50mm f/1.4, 85mm f/1.8, Godox flash kit',
    profile_photo: 'https://images.unsplash.com/photo-1493863647843-822729a24a42?auto=format&fit=crop&q=80&w=400',
    portfolio: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&q=80&w=600',
    ],
  },
  {
    email: 'aj.photography@mrphotographer.in',
    name: 'AJ PHOTOGRAPHY',
    phone: '08605589851',
    address: 'gurudatta colony, Lane Number 4, Bhekrai Nagar, Pune, Maharashtra 412308',
    city: 'Pune',
    lat: 18.472,
    lng: 73.942,
    price_per_hour: 2000,
    rating: 4.7,
    specialties: 'Events,Portrait',
    bio: 'Event and portrait specialist based in Bhekrai Nagar. From family functions to corporate events, we deliver vibrant, high-quality visuals.',
    gear: 'Canon EOS R6, 24-70mm f/2.8, 70-200mm f/2.8',
    profile_photo: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&q=80&w=400',
    portfolio: [
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=600',
    ],
  },
  {
    email: 'niks.studio@mrphotographer.in',
    name: "NIK'S PHOTOGRAPHY & STUDIO",
    phone: '07798980505',
    address: 'Shewalewadi Fata, Pune-Solapur Highway, Pune, Maharashtra 412307',
    city: 'Pune',
    lat: 18.489,
    lng: 73.955,
    price_per_hour: 3000,
    rating: 4.8,
    specialties: 'Wedding,Commercial',
    bio: 'Full-service photography studio on Pune-Solapur Highway. Specializing in weddings, pre-wedding shoots, and commercial brand photography.',
    gear: 'Nikon Z6 II, 35mm f/1.8, 105mm f/1.4, studio lighting setup',
    profile_photo: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=400',
    portfolio: [
      'https://images.unsplash.com/photo-1606216794074-735e0aa1787a?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1520854221256-17485179a091?auto=format&fit=crop&q=80&w=600',
    ],
  },
  {
    email: 'akshay.kalbhor@mrphotographer.in',
    name: 'Akshay Kalbhor Films and Photography',
    phone: '09762388474',
    address: 'Shop no.8, Pune Saswad Rd, near Bhekraimata, Phursungi, Bhekrainagar, Hadapsar, Pune, Maharashtra 412308',
    city: 'Pune',
    lat: 18.465,
    lng: 73.938,
    price_per_hour: 3500,
    rating: 5.0,
    specialties: 'Wedding,Events',
    bio: 'Award-winning wedding films and photography in Hadapsar and Phursungi. Cinematic wedding coverage with same-day highlights and premium albums.',
    gear: 'Sony FX3, DJI Ronin, 24-70mm GM, drone coverage',
    profile_photo: 'https://images.unsplash.com/photo-1564349683138-114b1182e0a7?auto=format&fit=crop&q=80&w=400',
    portfolio: [
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1529636798458-921d0896a6a9?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600',
    ],
  },
  {
    email: 'rushi.nimbalkar@mrphotographer.in',
    name: 'Rushi Nimbalkar Photography & Films',
    phone: '08668381211',
    address: 'Hadapsar - Saswad - Jejuri Rd, Bhekrai Nagar, Hadapsar, Pune, Maharashtra 412308',
    city: 'Pune',
    lat: 18.471,
    lng: 73.943,
    price_per_hour: 2800,
    rating: 4.8,
    specialties: 'Wedding,Events',
    bio: 'Wedding and event photography & films along Hadapsar-Saswad road. Documentary-style coverage with emotional storytelling.',
    gear: 'Canon R5, 50mm f/1.2, gimbal stabilizer, 4K video setup',
    profile_photo: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=400',
    portfolio: [
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=600',
    ],
  },
  {
    email: 'morya.studio@mrphotographer.in',
    name: 'MORYA PHOTOGRAPHY STUDIO & GRAPHICS',
    phone: '09284399554',
    address: 'Fursungi Bhekrai Rd, near BreakCup Cafe, Trimurti Vihar, Hadapsar, Pune, Maharashtra 412308',
    city: 'Pune',
    lat: 18.47,
    lng: 73.946,
    price_per_hour: 1800,
    rating: 4.6,
    specialties: 'Portrait,Commercial',
    bio: 'Portrait studio and graphics services in Trimurti Vihar. Passport photos, product shoots, and creative commercial photography at affordable rates.',
    gear: 'Fujifilm X-T5, 56mm f/1.2, studio backdrop kit',
    profile_photo: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&q=80&w=400',
    portfolio: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&q=80&w=600',
    ],
  },
  {
    email: 'arohi.studio@mrphotographer.in',
    name: 'Arohi Digital Photo Studio',
    phone: '08806053730',
    address: 'S K COMPLEX, Pune Saswad Rd, behind BUS STOP, Teachers Colony, Bhekrai Nagar, Pune, Maharashtra 412308',
    city: 'Pune',
    lat: 18.473,
    lng: 73.941,
    price_per_hour: 1500,
    rating: 4.5,
    specialties: 'Portrait,Real Estate',
    bio: 'Digital photo studio in Teachers Colony offering portraits, ID photos, and real estate photography for local property listings.',
    gear: 'Nikon D7500, 18-140mm, wide-angle lens for interiors',
    profile_photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    portfolio: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600',
    ],
  },
  {
    email: 'shrinath.photography@mrphotographer.in',
    name: 'Shrinath Photography',
    phone: '07798902802',
    address: 'Fursungi Bhekrai Rd, near Dhore Petroleum, Phursungi, Bhekrai Nagar, Pune, Maharashtra 412308',
    city: 'Pune',
    lat: 18.468,
    lng: 73.939,
    price_per_hour: 2200,
    rating: 4.7,
    specialties: 'Wedding,Events',
    bio: 'Wedding and event photographer near Phursungi. Traditional and candid coverage for Maharashtrian weddings and family celebrations.',
    gear: 'Canon 90D, 50mm f/1.8, 18-55mm kit, external flash',
    profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    portfolio: [
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&q=80&w=600',
    ],
  },
  {
    email: 'studio21.films@mrphotographer.in',
    name: 'Studio21 photography and films',
    phone: '08552829252',
    address: 'Flat no 102, shivkrupa heights, Saswad Rd, near HP petrol pump, Mantarwadi, Uruli Devachi, Pune, Maharashtra 412308',
    city: 'Pune',
    lat: 18.455,
    lng: 73.935,
    price_per_hour: 3200,
    rating: 4.9,
    specialties: 'Wedding,Commercial',
    bio: 'Premium wedding photography and cinematic films from Uruli Devachi. Luxury packages with drone coverage and same-day edits.',
    gear: 'Sony A7S III, cinema lenses, DJI Air 3 drone',
    profile_photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    portfolio: [
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1606216794074-735e0aa1787a?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1520854221256-17485179a091?auto=format&fit=crop&q=80&w=600',
    ],
  },
  {
    email: 'bellytobaby@mrphotographer.in',
    name: 'Belly To Baby Photography',
    phone: '09588605734',
    address: 'Park Infinia, B3, Fursungi Bhekrai Rd, opposite to core fitness gym, Bhekrai Nagar, Pune, Maharashtra 412308',
    city: 'Pune',
    lat: 18.474,
    lng: 73.944,
    price_per_hour: 4000,
    rating: 5.0,
    specialties: 'Portrait',
    bio: 'Specialist maternity, newborn, and baby photography in Bhekrai Nagar. Safe, gentle sessions capturing your family journey from belly to baby.',
    gear: 'Canon R6, 85mm f/1.2, softbox lighting, newborn props',
    profile_photo: 'https://images.unsplash.com/photo-1555252333-9f8e92e665df?auto=format&fit=crop&q=80&w=400',
    portfolio: [
      'https://images.unsplash.com/photo-1555252333-9f8e92e665df?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1515488042361-ee00e8170dc7?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600',
    ],
  },
];

const getFutureDate = (daysFromToday) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().split('T')[0];
};

const seedData = async () => {
  const userCount = await getQuery('SELECT COUNT(*) AS count FROM users');
  if (userCount.count > 0) {
    console.log('Database already seeded. Skipping seed phase.');
    return;
  }

  console.log('Seeding Pune photographers and demo accounts...');
  const defaultHash = bcrypt.hashSync('password123', bcrypt.genSaltSync(10));

  const adminRes = await runQuery(
    'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
    ['admin@mrphotographer.com', defaultHash, 'admin']
  );

  const clientRes = await runQuery(
    'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
    ['client@example.com', defaultHash, 'client']
  );
  const clientId = clientRes.lastID;

  const approvedIds = [];
  const slots = ['09:00 - 11:00', '11:00 - 13:00', '14:00 - 16:00', '16:00 - 18:00'];
  const availabilityDates = [getFutureDate(1), getFutureDate(2), getFutureDate(3), getFutureDate(4)];

  for (const photographer of PUNE_PHOTOGRAPHERS) {
    const userRes = await runQuery(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [photographer.email, defaultHash, 'photographer']
    );
    const userId = userRes.lastID;
    approvedIds.push(userId);

    await runQuery(
      `INSERT INTO photographer_profiles
       (user_id, name, bio, phone, address, city, lat, lng, price_per_hour, rating, specialties, gear, profile_photo, portfolio, is_approved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
      [
        userId,
        photographer.name,
        photographer.bio,
        photographer.phone,
        photographer.address,
        photographer.city,
        photographer.lat,
        photographer.lng,
        photographer.price_per_hour,
        photographer.rating,
        photographer.specialties,
        photographer.gear,
        photographer.profile_photo,
        JSON.stringify(photographer.portfolio),
      ]
    );

    const hourly = photographer.price_per_hour;
    const packages = [
      {
        type: 'basic',
        name: 'Mini Session',
        price: Math.round(hourly * 1.2),
        duration_hours: 1,
        features: ['1-hour shoot', '15 edited photos', 'Online gallery', '1 location in Pune'],
      },
      {
        type: 'standard',
        name: 'Standard Package',
        price: Math.round(hourly * 3),
        duration_hours: 3,
        features: ['3-hour shoot', '50 edited photos', 'Online gallery', '2 locations', 'High-res download'],
      },
      {
        type: 'premium',
        name: 'Full Experience',
        price: Math.round(hourly * 7),
        duration_hours: 6,
        features: ['6-hour shoot', '120 edited photos', 'Online gallery', 'Multiple locations', 'Print release', 'Assistant photographer'],
      },
    ];

    for (const pkg of packages) {
      await runQuery(
        `INSERT INTO packages (photographer_id, type, name, price, duration_hours, features)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, pkg.type, pkg.name, pkg.price, pkg.duration_hours, JSON.stringify(pkg.features)]
      );
    }

    for (const date of availabilityDates) {
      await runQuery(
        'INSERT INTO availability (photographer_id, date, slots) VALUES (?, ?, ?)',
        [userId, date, JSON.stringify(slots)]
      );
    }
  }

  const firstPhotographerId = approvedIds[0];
  const firstPackage = await getQuery(
    'SELECT id FROM packages WHERE photographer_id = ? AND type = ?',
    [firstPhotographerId, 'basic']
  );

  if (firstPackage) {
    const bookingRes = await runQuery(
      `INSERT INTO bookings (client_id, photographer_id, package_id, booking_date, time_slot, status, notes, total_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clientId,
        firstPhotographerId,
        firstPackage.id,
        getFutureDate(-5),
        '14:00 - 16:00',
        'completed',
        'Family portrait session in Shewalewadi.',
        Math.round(PUNE_PHOTOGRAPHERS[0].price_per_hour * 1.2),
      ]
    );

    await runQuery(
      'INSERT INTO reviews (booking_id, client_id, photographer_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [
        bookingRes.lastID,
        clientId,
        firstPhotographerId,
        5,
        'Excellent work! Rishi Photography captured our family moments beautifully. Highly recommended in Pune.',
      ]
    );
  }

  console.log(`Database seeded: admin id ${adminRes.lastID}, ${PUNE_PHOTOGRAPHERS.length} Pune photographers.`);
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
  await seedData();
};

export default pool;
