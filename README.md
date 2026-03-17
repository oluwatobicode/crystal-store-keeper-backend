# Crystal Store Keeper — Backend API

A **multi-tenant inventory management REST API** for retail businesses, built with Node.js, Express, TypeScript, and MongoDB. Supports complete business operations including product management, sales, stock tracking, customer management, role-based access control, and real-time notifications.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT + token blacklisting |
| File Uploads | Multer (memory storage) + Cloudinary |
| Email | Nodemailer |
| Bot Integration | Telegram Bot API |
| Build | `tsc` (TypeScript compiler) |

---

## 🏗️ Architecture

This is a **multi-tenant** API — every piece of data (users, products, sales, notifications) is scoped to a `businessId`. This means multiple businesses can use the same backend completely isolated from each other, enforced at the **database level** via compound indexes.

```
src/
├── config/         # App config, constants, DB connection
├── controllers/    # Route handlers (one file per resource)
├── middleware/     # Auth guard, error handler, file upload
├── models/         # Mongoose schemas
├── routes/         # Express routers
├── services/       # Telegram bot service
├── types/          # TypeScript interfaces
└── utils/          # Reusable helpers (email, audit log, cloudinary, notifications)
```

---

## ✨ Key Features

- **Multi-tenancy** — full data isolation per business via `businessId` scoping and compound unique indexes
- **JWT Auth** — stateless auth with token blacklisting for logout and password change
- **Role-Based Access Control (RBAC)** — granular permissions (e.g. `users.manage`, `inventory.receive`, `reports.export`)
- **Sales Engine** — transactional sales with automatic stock deduction, VAT calculation, split payments, and invoice ID generation
- **Stock Management** — stock movement history, reorder level alerts, inventory adjustments
- **Customer Ledger** — tracks `totalSpent` and `currentBalance` (for credit sales)
- **Profile Picture Upload** — per-user avatar via Cloudinary with 5MB limit
- **In-App Notifications** — persistent notification system with deduplication for low-stock alerts and login activity
- **Audit Logs** — every state-changing action is recorded with user, action, and timestamp
- **Email System** — OTP verification, password reset, welcome emails, and user invite emails
- **Automated Backups** — backup management endpoint

---

## 📡 API Endpoints

Base URL: `/api/v1`

### 🔐 Auth — `/auth`
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/sign-up` | Public | Register a new business + owner account |
| POST | `/login` | Public | Login, returns JWT |
| POST | `/logout` | Public | Invalidates token via blacklist |
| POST | `/verify-otp` | Public | Verify email with OTP |
| POST | `/resend-otp` | Public | Resend verification OTP |
| POST | `/reset-link` | Public | Send password reset email |
| POST | `/reset-password` | Public | Reset password with token |
| PATCH | `/change-password` | Protected | Change password (forces re-login) |

### 👤 Users — `/users`
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/me` | Protected | Get own profile |
| PATCH | `/me` | Protected | Update own name / contact number |
| PATCH | `/me/avatar` | Protected | Upload own profile picture |
| POST | `/` | `users.manage` | Create a new user (sends invite email) |
| GET | `/` | `users.manage` | Get all users for the business |
| GET | `/:id` | `users.manage` | Get a specific user |
| PATCH | `/:id` | `users.manage` | Update a user |
| PATCH | `/:id/status` | `users.manage` | Activate / suspend a user |
| PATCH | `/:id/avatar` | `users.manage` | Upload avatar for a user |
| DELETE | `/:id` | `users.manage` | Delete a user |

### 📦 Products — `/products`
CRUD for products, scoped per business. Unique SKU enforced **per business** (not globally).

### 🛒 Sales — `/sales`
Transactional sale creation with stock deduction, VAT, split payments, customer balance tracking, and automatic invoice ID generation.

### 📋 Inventory — `/inventory`
Stock receive, adjustments (damage/theft/return/correction), and movement history.

### 👥 Customers — `/customers`
Customer management with credit limit and balance tracking.

### 🏷️ Suppliers — `/suppliers`
Supplier directory scoped per business.

### 🔑 Roles — `/roles`
Custom role creation with granular permission assignment.

### 🔔 Notifications — `/notifications`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Fetch all notifications for the logged-in user |
| GET | `/unread-count` | Badge count (unread only) |
| PATCH | `/:id/read` | Mark one as read |
| PATCH | `/read-all` | Mark all as read |
| DELETE | `/:id` | Soft-delete one |
| DELETE | `/` | Clear all |

Notifications are triggered automatically for:
- 🔑 **Login activity** — on every successful login
- ⚠️ **Low stock** — when stock hits or drops below `reorderLevel` after a sale (deduplicated per product — only one unread alert per product at a time)

### 📊 Reports & Dashboard — `/reports`, `/dashboard`
Sales summaries, revenue reports, profit reports, and CSV export.

### 📝 Audit Logs — `/logs`
Read-only log of all actions (filterable, exportable to CSV).

### ⚙️ Settings — `/settings`
Business settings including VAT rate, invoice prefix, and store details.

### 💾 Backups — `/backups`
Backup and restore management.

---

## ⚡ Design Decisions Worth Noting

**Compound Indexes for Multi-tenancy**
```ts
productSchema.index({ SKU: 1, businessId: 1 }, { unique: true });
// Same SKU can exist in different businesses — no global conflict
```

**Token Blacklisting on Password Change**
When a user changes their password, the current JWT is immediately blacklisted — forcing a re-login with the new credentials.

**Fire-and-Forget Notifications**
Notifications and audit logs are always called with `.catch(console.error)` outside the main transaction. A failed notification write **never crashes a sale or login**.

**Soft Delete on Notifications**
Deleted notifications have `isDeleted: true` — they remain in the DB so deduplication logic (via `referenceId`) still works correctly after a user dismisses an alert.

**Notification Deduplication**
Low-stock alerts use `findOneAndUpdate` with upsert on `{ userId, businessId, referenceId }`. The same product won't spam duplicate alerts — the existing unread one is refreshed instead.

---

## 🔧 Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/oluwatobicode/crystal-store-keeper-backend.git
cd crystal-store-keeper-backend

# 2. Install dependencies
npm install

# 3. Create a .env file
cp .env.example .env
# Fill in the required environment variables (see below)

# 4. Run in development
npm run dev

# 5. Build for production
npm run build
```

### Environment Variables

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_HOST=...
EMAIL_PORT=587
EMAIL_USER=...
EMAIL_PASS=...
FRONTEND_URL=http://localhost:5173
APP_URL=https://your-deployed-url.com
TELEGRAM_BOT_TOKEN=...
```

---

## 🗂️ Data Models

| Model | Key Fields |
|---|---|
| `User` | `email`, `username`, `role`, `businessId`, `avatarUrl`, `mustChangePassword` |
| `Business` | `businessName`, `businessEmail`, `owner` |
| `Product` | `SKU`, `currentStock`, `reorderLevel`, `businessId` |
| `Sale` | `invoiceId`, `items[]`, `payments[]`, `paymentStatus`, `businessId` |
| `Customer` | `customerId`, `creditLimit`, `currentBalance`, `businessId` |
| `Notification` | `userId`, `type`, `isRead`, `isDeleted`, `referenceId` |
| `AuditLog` | `userId`, `action`, `category`, `businessId` |
| `StockMovement` | `productId`, `movementType`, `stockBefore`, `stockAfter` |
| `Role` | `roleName`, `permissions[]`, `businessId` |

---

## 📄 License

MIT
