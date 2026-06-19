# Mr.Photographer Backend

Node.js + Express API backed by **MySQL**.

## Prerequisites

1. [MySQL 8.0+](https://dev.mysql.com/downloads/installer/) installed and running
2. Node.js 18+

## Setup

### 1. Create the database

Open **MySQL Workbench** or `mysql` CLI and run:

```sql
CREATE DATABASE mrphotographer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure environment

Copy `.env.example` to `.env` and set your connection details:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=mrphotographer
PORT=5000
JWT_SECRET=your_secret_key
```

### 3. Install and start

```bash
npm install
npm run dev
```

On first start, tables are created and **10 Pune photographers** are seeded automatically.

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mrphotographer.com | password123 |
| Client | client@example.com | password123 |
| Photographer | rishi.photography@mrphotographer.in | password123 |

All 10 seeded photographers use `password123`.

## Seeded Pune studios

- Rishi Photography
- AJ PHOTOGRAPHY
- NIK'S PHOTOGRAPHY & STUDIO
- Akshay Kalbhor Films and Photography
- Rushi Nimbalkar Photography & Films
- MORYA PHOTOGRAPHY STUDIO & GRAPHICS
- Arohi Digital Photo Studio
- Shrinath Photography
- Studio21 photography and films
- Belly To Baby Photography

## Reset seed data

To re-seed, drop all tables or the whole database, then restart the server:

```sql
DROP DATABASE mrphotographer;
CREATE DATABASE mrphotographer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
