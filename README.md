# Event Registration System

A full-stack event registration system with an employee admin portal and a public registration portal.

## Tech Stack

- **Backend**: Node.js, TypeScript, Express.js, Sequelize, MySQL, Winston, Jest
- **Frontend**: React, TypeScript, Vite, Material UI, React Router, Axios

## Project Structure

```
.
├── backend/    # Express.js API (port 8000)
└── frontend/   # React app (port 8001)
```

---

## Database Setup

1. Ensure MySQL is running on your machine.

2. Create the database:
   ```sql
   CREATE DATABASE event_registration CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. Copy the environment file and fill in your credentials:
   ```bash
   cp backend/.env.example backend/.env
   ```

4. Edit `backend/.env` with your MySQL credentials and OneMap API credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=event_registration
   DB_USER=root
   DB_PASSWORD=yourpassword

   ONEMAP_EMAIL=your_onemap_email@example.com
   ONEMAP_PASSWORD=your_onemap_password
   ```

   > **OneMap API**: Register a free account at https://www.onemap.gov.sg/apidocs/register to obtain credentials for postal code validation.

---

## Seeding Initial Data

The seed script creates 5 initial employee records (handlers). Tables are created automatically when the server starts.

```bash
cd backend
npm run seed
```

---

## Running the System Locally

### Backend

```bash
cd backend
npm install
npm run dev
```

The API server starts at **http://localhost:8000**.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at **http://localhost:8001**.

---

## Running Unit Tests

```bash
cd backend
npm test
```

To run with coverage report:
```bash
npm test -- --coverage
```

Coverage is collected for all files under `src/` except `src/server.ts` and `src/config/`.

---

## API Reference

All endpoints follow these HTTP status conventions:
- `200` — Success
- `421` — Validation error (format, uniqueness, business rules)
- `400` — Expected client error (resource not found, event closed)
- `500` — Unexpected server error

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/events` | List all events (paginated, searchable, filterable) |
| POST | `/api/admin/events` | Create a new event |
| POST | `/api/admin/events/:uuid/trend` | Get registration trend for an event |
| GET | `/api/admin/employees` | List all employees (for handler selection) |

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/events` | List all open events |
| POST | `/api/public/register` | Register for an event |
