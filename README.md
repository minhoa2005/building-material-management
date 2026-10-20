# WMSD Backend API (`sep490-api`)

Backend API service for **WMSD (Warehouse Management System Development)** — Ceramic Tile Warehouse Management System (Capstone SEP490_G56).

## Tech Stack
- **Runtime:** Node.js (ESM `type: "module"`)
- **Framework:** Express 5
- **Database:** MongoDB Atlas via Mongoose 9
- **Validation:** Zod
- **Authentication:** JWT (`jsonwebtoken`) + Password Hashing (`bcryptjs`)
- **Media Uploads:** Multer + Cloudinary SDK
- **Testing:** Node.js native test runner (`node --test`)

## Project Structure
Organized following feature-based / modular architecture:

```text
src/
├── app.js                          # Express application configuration & middlewares
├── index.js                        # Server entry point & DB bootstrap
├── routes.js                       # Top-level API router (/api/...)
├── config/
│   ├── database.js                 # MongoDB connection logic
│   └── cloudinary.js               # Cloudinary integration config
├── middlewares/
│   ├── auth.js                     # Authentication (JWT) & RBAC authorization
│   ├── errorHandler.js             # Centralized error handler
│   ├── upload.js                   # Multer single image upload middleware
│   └── validate.js                 # Zod schema validation middleware
├── models/                         # Mongoose data models
│   ├── access.model.js             # Role & Permission
│   ├── business-document.model.js  # Business document polymorphic model
│   ├── document-line.model.js      # Line items
│   ├── document-link.model.js      # Document links
│   ├── event.model.js              # Audit events & outbox
│   ├── inventory.model.js          # Balances, movements, batches
│   ├── product.model.js            # Products, UOM, Lots
│   ├── user.model.js               # Staff user account
│   └── warehouse.model.js          # Warehouses & Locations
├── modules/                        # Business feature modules
│   ├── auth/                       # Authentication (Login, token generation)
│   ├── health/                     # Health check (/api/health)
│   ├── roles/                      # Role & Permissions management (/api/roles)
│   ├── upload/                     # Cloudinary media uploads (/api/upload)
│   └── users/                      # User account management (/api/users)
├── seeds/                          # Database seeder (Default roles & accounts)
└── shared/
    └── utils/
        ├── ApiError.js             # Custom error wrapper
        ├── ApiResponse.js          # Uniform API response helper
        └── catchAsync.js           # Async route wrapper
```

## Getting Started

### 1. Environment Setup
Copy `.env.example` to `.env` and fill in your connection strings:

```bash
cp .env.example .env
```

Configuration keys:
```ini
PORT=3333
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/sep490?retryWrites=true&w=majority"
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
JWT_SECRET=your_secret_key_here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev      # Starts with nodemon on port 3333
```

### 4. Run Tests
```bash
npm test         # Runs node --test suite
```

## Default Seeded Accounts
On startup, the system automatically checks and seeds 5 demo accounts into MongoDB:
- `admin@ceratile.vn` / `Admin@123` (Admin)
- `owner@ceratile.vn` / `Owner@123` (Store Owner)
- `sales@ceratile.vn` / `Sales@123` (Sales Staff)
- `warehouse@ceratile.vn` / `Kho@12345678` (Warehouse Staff)
- `accountant@ceratile.vn` / `KeToan@123` (Accountant)

## Key Endpoints
- `GET /api/health`: Health status
- `POST /api/auth/login`: User authentication & JWT issuance
- `POST /api/upload`: Upload image to Cloudinary (multipart `file`)
- `GET /api/users`: List users (supports pagination, search, role/status filter)
- `POST /api/users`: Create user account
- `GET /api/users/:id`: Get user details
- `PUT /api/users/:id`: Update user info / change role
- `PATCH /api/users/:id/status`: Toggle user active/locked status
- `GET /api/roles`: List all system roles and permissions
- `PUT /api/roles/:code/permissions`: Update role permissions matrix
