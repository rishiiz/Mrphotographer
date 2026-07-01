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

On first start, tables are created automatically.

## Creating an Admin Account

Since there are no auto-seeded accounts, you must create an admin account manually:

1. Register a new account on the frontend (e.g., `admin@yourdomain.com`).
2. Open your MySQL client and update the user's role to `admin`:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@yourdomain.com';
```

3. Log in again with those credentials to access the admin dashboard.

## Reset seed data

To re-seed, drop all tables or the whole database, then restart the server:

```sql
DROP DATABASE mrphotographer;
CREATE DATABASE mrphotographer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
