# Mr. Photographer

Mr. Photographer is a full-stack web application designed to connect clients with professional photographers. 

The project is divided into two main parts:
- **Frontend**: A React application built with Vite.
- **Backend**: A Node.js/Express API that connects to a MySQL database.

---

## 🚀 Quick Start with Docker (Recommended)

The easiest way to get the entire project up and running is by using Docker. The project includes a `docker-compose.yml` file that orchestrates the frontend, backend, and the MySQL database simultaneously.

### Prerequisites
- [Docker](https://www.docker.com/get-started) installed on your system.
- [Docker Compose](https://docs.docker.com/compose/install/) installed.

### Setup Procedure

1. **Clone the repository** (or navigate to your project directory):
   ```bash
   cd "Mr photograperV.0.0.01"
   ```

2. **Start the containers**:
   Run the following command to build and start the application in the background:
   ```bash
   docker-compose up --build -d
   ```

3. **Access the Application**:
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000](http://localhost:5000)
   - **MySQL Database**: `localhost` on port `3307` 
     *(Username: `root`, Password: `root`, Database: `mrphotographer`)*

4. **Stopping the containers**:
   When you're done, you can stop the application by running:
   ```bash
   docker-compose down
   ```

---

## 🐳 About the Docker Containers

The `docker-compose.yml` defines the following three services:

1. **`db` (MySQL 8.0)**
   - Runs a MySQL instance.
   - **Port:** Exposed to the host machine on `3307` (to avoid conflicts with any local MySQL installations you may have running on `3306`).
   - **Storage:** Uses a Docker volume (`db_data`) so that your database records are not lost when the container is stopped or removed.

2. **`backend` (Node.js)**
   - Builds from the `backend/Dockerfile`.
   - Connects to the `db` service on its internal port `3306`.
   - Runs the Express API on port `5000`.
   - On the first run, the database tables and initial mock data (like Pune photographers) are automatically seeded.
   - Includes a restart policy (`restart: unless-stopped`) to ensure it reconnects successfully if the database takes a few extra seconds to initialize.

3. **`frontend` (React + Nginx)**
   - Builds from a multi-stage `frontend/Dockerfile`.
   - First, it compiles the Vite app into static assets.
   - Then, it uses an `nginx:alpine` image to serve those static files on port `80` (mapped to `3000` on your host).
   - Configured via `nginx.conf` to support client-side routing (React Router).

---

## 💻 Manual Setup (Without Docker)

If you prefer to run the project locally without Docker, you will need to set up MySQL manually, start the backend, and run the frontend development server separately.

Please refer to the individual README files in their respective directories for detailed manual setup instructions:
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
