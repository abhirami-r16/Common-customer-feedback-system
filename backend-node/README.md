# Node.js + Express.js Backend for Common Customer Feedback System

This directory (`backend-node/`) contains the complete replacement backend for the Common Customer Feedback System, migrated from PHP Laravel 11 to Node.js + Express.js + MySQL.

## Highlights & Compatibility
- **100% Contract Compatible**: Preserves all 30 RESTful API endpoints and response payloads used by the React + Vite frontend.
- **Dual Authentication**: Seamlessly accepts existing Laravel Sanctum tokens (`id|plaintext`) as well as standard JWT tokens.
- **Password Hashes**: Full support for legacy `$2y$12$` bcrypt password hashes alongside new `$2a$` / `$2b$` hashes.
- **Non-Destructive Database**: Connects directly to the existing MySQL database (`common_feedback_system`) with additive schema migrations only.
- **Automated Test Suite**: 35 automated endpoint and security tests with 100% pass rate.

---

## Directory Structure

```
backend-node/
├── src/
│   ├── config/             # Database connection pool and application configuration
│   ├── controllers/        # Controllers (auth, dashboard, formBuilder, admin)
│   ├── middleware/         # Auth, validation, and centralized error handling
│   ├── routes/             # Express route modules
│   ├── services/           # Reusable business logic services
│   ├── utils/              # Pagination, slug generation, date formatting
│   ├── validators/         # Zod request validation schemas
│   ├── app.js              # Express app setup and middleware
│   └── server.js           # Server bootstrap and graceful shutdown
├── scripts/
│   ├── init-db.js          # Safe, non-destructive database initializer
│   └── fix-passwords.js    # Password hash maintenance script
├── tests/
│   └── run-tests.js        # Automated integration test runner
├── .env.example            # Environment variables template
├── package.json
└── README.md
```

---

## Getting Started Locally

### 1. Prerequisites
- Node.js >= 18.0.0 (tested on Node v22.14.0)
- MySQL server (version 5.7+ or 8.x, e.g. WAMP / MySQL service on port 3306)

### 2. Install Dependencies
```bash
cd backend-node
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and verify your database settings:
```bash
cp .env.example .env
```
Default local settings:
```env
PORT=8000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=common_feedback_system
DB_USERNAME=root
DB_PASSWORD=
JWT_SECRET=super_secret_feedbackhub_jwt_key_2026_production_ready
ADMIN_EMAIL=admin@gmail.com
FRONTEND_URL=https://common-customer-feedback-system.vercel.app
ALLOWED_ORIGINS=https://common-customer-feedback-system.vercel.app,http://localhost:5173,http://127.0.0.1:5173
```

### 4. Initialize Database (Non-Destructive)
Ensures all required tables (`users`, `personal_access_tokens`, `feedback_forms`, `form_sections`, `form_questions`, `question_options`, `feedback_submissions`, `password_reset_tokens`) are present:
```bash
npm run db:init
```

### 5. Run the Automated Tests
```bash
npm test
```
All 35 tests will execute against the local test server and report passes/failures.

### 6. Start the Server
```bash
# Normal start
npm start

# Development mode with auto-reload (Node --watch)
npm run dev
```
The server will listen at `http://localhost:8000` with the API available at `http://localhost:8000/api`.

---

## Health Check
You can test the server at any time by pinging:
```
GET http://localhost:8000/api/health
```
Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-10-28T10:05:00.000Z",
  "database": "connected",
  "uptime_seconds": 15
}
```
