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
├── seeds/                          # Empty-database demo seeder (all 39 collections)
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

## Demo seed data

Run `npm run seed` from `be/`, or start the server with `SEED_ON_STARTUP=true`
(the default). The seeder inserts data **only when the entire database is empty**.
One existing document in any non-system collection, including a legacy collection,
skips all seed inserts. Empty collections and indexes alone do not block seeding.
An existing database with only accounts/roles is also skipped; this is not a migration.

The dataset covers all **39 collections, 35 document kinds and 19 line kinds**:
permissions/roles/accounts, warehouses/locations, parties, products/UOM/conversions,
lots/policies, procurement, SO/WIR/OD/GI/POD/payment, CR/FD/SR, transfers,
defects/dispositions, stocktake plans/counts/holds, references/links/approvals,
inventory/batches/movements/reservations/allocations, audit and outbox.

Fixtures include a completed sale, a wholly cancelled sale, a failed delivery with
reopened demand and a replacement OD, a partial transfer with 2 pieces in transit,
and a frozen stocktake with a draft resolution. Revision 3.3 adds a separate closed stocktake, an RR saved from a stocktake form, a mixed source/reserve RR directly from an SO without WIR and a no-compatible-source SO still without RR, per-recipient read/unread Notifications, planning guards and an unhandled zero-stock product. Stock balances reconcile to the
seed ledger. Quantities and conversion factors use decimal strings.

**MongoDB Atlas or a replica set is required** because all inserts commit in one
transaction. For local MongoDB, configure a replica set (for example `rs0`) and use
the matching `replicaSet` connection option shown in `.env.example`. Standalone
MongoDB is rejected before inserts. Validation and index creation happen before
the transaction; an insert failure rolls back the complete dataset. Running seed
again preserves existing records, passwords, role permissions and warehouse scopes.

All business records, supplier terms and external references are synthetic demo
data. Evidence keys under `demo-only/` are placeholders, not uploaded files; POD
metadata uses a tiny synthetic PNG hash. These are not proof of real inspections,
deliveries or payments. Outbox fixtures are already marked delivered so they do
not enqueue real messages.

`npm run seed:sync-permissions` is separate, explicit maintenance: on a populated
database it updates only existing roles using existing permission records. It
never inserts missing roles/permissions or business fixtures, and fails before
updates if required permissions are absent. Server startup never syncs permissions.
`SEED_SYNC_ROLE_PERMISSIONS=true` applies only to the manual seed CLI.

The six demo login accounts keep their existing credentials:

- `admin@ceratile.vn` / `Admin@123` (Admin)
- `owner@ceratile.vn` / `Owner@123` (Store Owner)
- `sales@ceratile.vn` / `Sales@123` (Sales Staff)
- `warehouse@ceratile.vn` / `Kho@12345678` (Warehouse Staff)
- `warehouse2@ceratile.vn` / `Kho2@12345678` (Warehouse Staff, independent receiver)
- `accountant@ceratile.vn` / `KeToan@123` (Accountant)

`npm test` validates fixture schemas, coverage, references, credential hashes,
ledger reconciliation and the nonempty-database guard without connecting to MongoDB.
Set `MONGODB_TEST_URI` to a test replica set to also exercise insertion, repeat
runs and transaction rollback. Integration tests always use random
`sep490_seed_verification_<ObjectId>` databases and remove only those temporary databases.

## Replenishment and Notification revision 3.3

See [the accepted proposal](git_doc/docs/03_thiet_ke/De_xuat_bo_sung_hang_theo_nguon_2026-10-27.md) and [shared model contracts](src/models/README.md). Models and fixtures support explicit saving/submission of one prefilled form, direct SO-line/count sources, versioned minimum/target policies, guards and Notifications. These definitions do not expose replenishment/notification APIs or run an outbox consumer. The listed endpoints below retain their actual runtime scope.

For an existing populated database, run `npm run migrate:replenishment` to preview,
then `npm run migrate:replenishment -- --apply` to upgrade the configured
`MONGODB_URI`. Apply requires a replica set/Atlas and first saves a consistent BSON
Extended JSON backup under `~/.codex/backups/` (outside Git), including collection
options and indexes. Keep that backup private; it includes account data.

The migration adds minimum/target policy fields, converts existing standard RR
lines using their recorded textual reason, adds the three new permission records
and grants them to eligible existing roles, and creates the model indexes without
dropping any. Historical RRs without evaluation snapshots become `MANUAL_OTHER`;
the migration does not invent source evaluations, submission actors/times or
policy editors. Existing IDs, approvals, document versions, quantities, stock,
passwords and other role grants stay intact. Invalid policies, ambiguous RR lines
or source events without their actual historical version block the data upgrade.
Data updates commit together and a second run has no data changes. This upgrade
does not insert new demo scenarios or generate historical notifications. Ordinary
seeding still skips populated databases.

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
