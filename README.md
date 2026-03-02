# Food Order Management System

Production-ready full-stack food stall order management app.

## Tech Stack
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Node.js + Express + TypeScript
- Database: MongoDB + Mongoose
- Auth: JWT access + refresh tokens
- File Uploads: Multer with local storage (`/uploads`)
- Charts: Recharts
- HTTP Client: Axios
- State Management: React Context API

## Features
- Secure authentication (register/login/logout/refresh/me)
- Stall profile management with logo upload
- Menu management (CRUD, image upload, availability, cost price)
- Combo offers from existing menu items with discount auto-calculation
- Manual order creation with unique daily tokens (`TOK-YYYYMMDD-###`)
- Order status workflow: Pending -> Preparing -> Ready -> Completed
- Printable POS-style receipt page optimized for thermal width
- Dashboard with:
  - Orders today
  - Revenue today
  - Profit today (`sales - cost`)
  - Monthly revenue/profit graph
  - Top-selling items
  - Combo sales analytics
- Pagination support in menu/orders APIs

## Folder Structure

```text
backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    scripts/
    utils/
    types/
frontend/
  src/
    components/
    context/
    hooks/
    layouts/
    pages/
    services/
    types/
```

## Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Backend runs on `http://localhost:5000`.

### Seed Demo Data

```bash
cd backend
npm run seed
```

Demo credentials:
- Email: `owner@example.com`
- Password: `Password@123`

## Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Core API Endpoints

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

### Stall
- `GET /api/v1/stall/me`
- `POST /api/v1/stall/me` (multipart)
- `PUT /api/v1/stall/me` (multipart)

### Menu
- `GET /api/v1/menu`
- `POST /api/v1/menu` (multipart)
- `PUT /api/v1/menu/:id` (multipart)
- `DELETE /api/v1/menu/:id`

### Combos
- `GET /api/v1/combos`
- `POST /api/v1/combos`
- `PUT /api/v1/combos/:id`
- `DELETE /api/v1/combos/:id`

### Orders
- `GET /api/v1/orders`
- `GET /api/v1/orders/:id`
- `POST /api/v1/orders`
- `PATCH /api/v1/orders/:id/status`

### Dashboard
- `GET /api/v1/dashboard/summary`

## Docker (Optional)

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- MongoDB: `mongodb://localhost:27017`

## Security & Quality Notes
- Passwords hashed with bcrypt
- JWT guard middleware for protected routes
- Refresh-token rotation with cookie + hashed storage
- Zod request validation
- Centralized error handling
- Environment variable based configuration
- Unique indexed token generation per stall per day