# Nexyvora Backend

This is the standalone Node.js backend for the Nexyvora platform, designed to replace Supabase and work with a MySQL database.

## 🚀 Setup & Running

1. **Prerequisites**: Ensure you have Node.js installed.
2. **Database**: Make sure you have imported `mysql_schema.sql` into your MySQL server (via MAMP/phpMyAdmin).
3. **Configuration**: The database credentials are set in the `.env` file.
   - Host: `localhost`
   - User: `root`
   - Pass: `root`
   - DB: `nexyvora`
4. **Install Dependencies**:
   ```bash
   cd backend
   npm install
   ```
5. **Start the Server**:
   ```bash
   npm start
   ```
   The server will run on `http://localhost:5000`.

## 🛠️ API Endpoints

### Authentication (`/api/auth`)
- `POST /register`: Register a new user.
- `POST /login`: Login and receive JWT token.

### Academic (`/api/academic`) - Protected (Admin only for POST)
- `GET /programs`: Get all programs.
- `POST /programs`: Create a program.
- `GET /specialties`: Get all specialties.
- `POST /specialties`: Create a specialty.
- `GET /cohorts`: Get all cohorts.
- `POST /cohorts`: Create a cohort.
- `GET /modules`: Get all modules.
- `POST /modules`: Create a module.

### User & Stats (`/api/user`) - Protected
- `GET /profile`: Get current user profile.
- `GET /stats/admin`: Get admin dashboard stats.
- `GET /stats/student`: Get student dashboard stats.
- `GET /stats/teacher`: Get teacher dashboard stats.

### File Upload (`/api/upload`) - Protected
- `POST /`: Upload a file (field name: `file`). Returns the URL.

## 📂 Structure

- `server.js`: Main entry point.
- `config/db.js`: Database connection pool.
- `routes/`: Express routes.
- `controllers/`: Business logic for handling requests.
- `middleware/`: Authentication and error handling middleware.
