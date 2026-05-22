# Backend API - Volunteer Management System

This backend handles all Supabase database operations for the volunteer management system.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Verify `.env` file** has your Supabase credentials:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `PORT` (defaults to 3001)

3. **Start the backend server:**
   ```bash
   npm start
   ```

   The server will run on `http://localhost:3001`

  CORS allows Vercel preview deployments; update the allowlist in `server.js` if needed.

## API Endpoints

### POST `/api/volunteers/signup`
Submit a new volunteer registration with optional photo upload.

**Form Data:**
- `fullName` (required)
- `age`
- `email` (required)
- `phone`
- `experience`
- `description`
- `photoUpload` (file - optional)

**Response:**
```json
{
  "success": true,
  "message": "Volunteer signup successful",
  "data": { ... }
}
```

### POST `/api/volunteers/login`
Login a volunteer by email.

**Request Body:**
```json
{
  "email": "volunteer@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": { ... }
}
```

### GET `/api/health`
Health check endpoint.

## Frontend Integration

The frontend at `../frontend/` calls these API endpoints from `js/index.js`. Make sure the backend is running before using the frontend.

## Database

All data is stored in Supabase:
- **Table:** `Volunteers`
- **Storage:** `volunteer_photos` (for photo uploads)
