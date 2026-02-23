# Crystal Stock Keeper

> A full-featured Point-of-Sale (POS), inventory management, and business analytics platform built for retail operations. Manage sales, customers, stock, users, and reporting from a single unified interface.

---

## For AI Assistants — Read This First

If you are an AI assistant (Cursor, Copilot, Claude, etc.) helping with this codebase, read this section carefully before suggesting or generating any code.

**What this project is:**
Crystal Stock Keeper is a business management system for a retail store. It is NOT a generic CRUD app. It handles real business logic: inventory tracking tied to sales, split payments across multiple methods, role-based access with granular permissions, invoice generation, and financial reporting.

**Stack:**

- Frontend: React + TypeScript + TailwindCSS (already built — do not regenerate UI)
- Backend: Node.js + Express.js + TypeScript
- Database: MongoDB with Mongoose ODM
- Auth: JWT (access tokens + refresh tokens) + bcrypt password hashing

**Critical rules when generating backend code:**

1. Every write operation (sale, stock change, user change, setting change) must write an entry to the `auditLogs` collection via the `logAudit(userId, action, details, category)` utility.
2. Every inventory change (sale, receive stock, adjustment) must write a document to `stockMovements`. This is how the stock movement report is built.
3. Payments on a sale are stored as an **array** to support split payments. Never assume a single payment method per sale.
4. VAT rate must be read from the `settings` document at the time of sale creation and stored on the transaction — never recalculate retroactively.
5. Invoice IDs follow the format `{PREFIX}-{YYYYMMDD}-{SEQUENCE}` e.g. `JCC-20250817-0001`. Prefix is pulled from settings. Sequence is per-day and zero-padded to 4 digits. Use a `counters` collection with `findOneAndUpdate + $inc` to avoid duplicates.
6. All protected routes use JWT Bearer auth + RBAC middleware. Check `req.user.role.permissions` (array of strings) before allowing access.
7. `currentStock` on a product is never set directly after initial creation — it is always modified through `stockMovement` writes (sale deducts, receive adds, adjustment corrects).
8. Always use bcrypt for passwords. Never store plain text. When creating a user, hash before saving.
9. The `settings` collection has exactly ONE document. Always upsert, never insert a second.
10. `daysLeft` for a product = `currentStock / avgDailySales` where `avgDailySales` = total units sold in last 30 days / 30. Return `null` if no sales history exists.
11. `suggestedOrder` for a product = `preferredStockLevel - currentStock`. Return 0 if already above preferred level.
12. Split payment validation: `sum(payments[].amount)` must equal `grandTotal` — enforce this server-side before saving a sale.
13. Customer `currentBalance` increases when a sale is `partial` or `pending` (customer owes money). It decreases when they pay off debt.
14. "Cash in register" on the dashboard = sum of all `cash` payment amounts for the current business day only.

---

## Tech Stack

| Layer           | Technology                             |
| --------------- | -------------------------------------- |
| Frontend        | React, TypeScript, TailwindCSS         |
| Backend         | Node.js, Express.js, TypeScript        |
| Database        | MongoDB (Mongoose ODM)                 |
| Auth            | JWT (access + refresh tokens) + bcrypt |
| PDF Generation  | pdfkit or puppeteer                    |
| Background Jobs | node-cron (for scheduled backups)      |

---

## Features

### Dashboard

- Live summary cards: today's sales, cash in register, pending payments, low stock count
- Recent transactions feed
- Low stock items list

### Sales & POS

- Create sales with customer info, cart items, and flexible payment
- Support for single and split payments (cash, POS terminal, bank transfer)
- Automatic invoice generation in format `JCC-YYYYMMDD-0001`
- Full transaction detail view with invoice download, PDF export, and print

### Customer Management

- Individual and business customer profiles
- Credit limit and balance tracking
- Full transaction history per customer with clickable invoice detail modal
- Summary metrics: total spent, transaction count, last purchase

### Inventory

- Product catalogue with SKU, brand, location, unit, and reorder configuration
- Receive stock from suppliers with cost tracking
- Stock adjustments with typed reasons (damage, theft, correction, return, initial count, supplier return)
- Reorder alerts with calculated days-left based on 30-day sales velocity
- Suggested order quantities based on preferred stock levels
- Full stock movement log (every inventory change recorded)

### Payments & Transactions

- Filterable transaction list across all payment methods
- Detailed invoice modal per transaction
- Export, download, and print invoices

### Reports & Analytics

- Date-range filtering across all reports
- Sales report: daily breakdown, totals, transaction count, average value
- Product analysis: per-product revenue, units sold, transaction count
- Payment methods breakdown: cash vs POS vs transfer with percentages
- Stock movement report: full audit of inventory changes over time

### Users & Roles

- User management with status control (active/suspended)
- Role-based access control (RBAC) with granular permissions
- Built-in roles (Admin, Manager, Cashier) and custom role creation
- Temporary password on user creation, force password change on first login

### Settings

- Business information and store logo
- Invoice configuration (prefix, starting number, notes/disclaimer)
- System preferences: VAT toggle and rate, currency, session timeout, manager approval threshold for discounts
- Backup & restore: manual export (CSV/JSON), scheduled backups, restore from backup
- Audit logs: full action history with user attribution and export

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/crystal-stock-keeper.git
cd crystal-stock-keeper

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Environment Variables

Create a `.env` file in the `/server` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/crystal-stock-keeper
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
```

### Running the App

```bash
# Start backend (from /server)
npm run dev

# Start frontend (from /client)
npm run dev
```

Backend: `http://localhost:5000`
Frontend: `http://localhost:5173`

---

## Project Structure

```
crystal-stock-keeper/
├── client/                        # React + TypeScript frontend (already built)
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Route-level page components
│   │   │   ├── Dashboard/
│   │   │   ├── Sales/
│   │   │   ├── Customers/
│   │   │   ├── Inventory/
│   │   │   ├── Transactions/
│   │   │   ├── Reports/
│   │   │   ├── Users/
│   │   │   └── Settings/
│   │   ├── hooks/                 # Custom React hooks
│   │   └── utils/                 # Frontend helpers
│   └── package.json
│
├── server/                        # Express + Node.js backend (in progress)
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts              # Mongoose connection
│   │   │   └── env.ts             # Validated env vars (throw on missing)
│   │   ├── middleware/
│   │   │   ├── auth.ts            # JWT verification, attaches req.user
│   │   │   ├── rbac.ts            # checkPermission('permission.string') middleware
│   │   │   ├── errorHandler.ts    # Global error handler
│   │   │   └── auditLogger.ts     # Middleware to auto-log write operations
│   │   ├── models/                # Mongoose schemas
│   │   │   ├── User.ts
│   │   │   ├── Role.ts
│   │   │   ├── Customer.ts
│   │   │   ├── Product.ts
│   │   │   ├── Supplier.ts
│   │   │   ├── Sale.ts
│   │   │   ├── StockMovement.ts
│   │   │   ├── Adjustment.ts
│   │   │   ├── Settings.ts
│   │   │   ├── AuditLog.ts
│   │   │   └── Counter.ts         # For invoice sequence generation
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── role.routes.ts
│   │   │   ├── customer.routes.ts
│   │   │   ├── product.routes.ts
│   │   │   ├── supplier.routes.ts
│   │   │   ├── inventory.routes.ts
│   │   │   ├── sale.routes.ts
│   │   │   ├── report.routes.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── settings.routes.ts
│   │   │   ├── auditLog.routes.ts
│   │   │   └── backup.routes.ts
│   │   ├── controllers/           # Thin route handlers — call services, return responses
│   │   ├── services/
│   │   │   ├── invoiceService.ts  # Invoice ID generation using Counter collection
│   │   │   ├── reportService.ts   # MongoDB $aggregate pipelines for all reports
│   │   │   ├── backupService.ts   # CSV/JSON export + scheduled backup + restore
│   │   │   └── stockService.ts    # daysLeft, suggestedOrder calculations
│   │   └── utils/
│   │       ├── response.ts        # Standard API response: { success, data, message }
│   │       ├── auditLog.ts        # logAudit(userId, action, details, category)
│   │       └── dateHelpers.ts     # Date range utils, day-start/end helpers
│   ├── app.ts
│   ├── server.ts
│   └── package.json
│
└── README.md
```

---

## Data Models (Full Schemas)

These are the Mongoose schemas to implement. Field names here are the source of truth — the frontend is already aligned to them.

### User

```typescript
{
  _id: ObjectId,
  fullname: string,
  username: string,              // unique — used for login
  passwordHash: string,          // bcrypt — NEVER store plain text
  role: ObjectId,                // ref: 'Role'
  contactNumber: string,
  status: 'active' | 'inactive' | 'suspended',
  mustChangePassword: boolean,   // true when first created — force change on login
  lastLogin: Date | null,
  createdAt: Date,               // auto via timestamps: true
  updatedAt: Date
}
```

### Role

```typescript
{
  _id: ObjectId,
  roleName: string,              // 'Admin', 'Manager', 'Cashier', or custom
  description: string,
  permissions: string[],         // e.g. ['pos.operate', 'transactions.view']
  isDefault: boolean,            // true for Admin/Manager/Cashier — cannot be deleted
  createdAt: Date,
  updatedAt: Date
}
```

All available permission strings:
`dashboard.view`, `pos.operate`, `pos.discount.small`, `pos.discount.large`, `pos.refund`, `transactions.view`, `inventory.view`, `inventory.receive`, `inventory.adjust`, `inventory.manage`, `customers.view`, `customers.manage`, `reports.view`, `users.manage`, `settings.manage`, `audit.view`, `backup.manage`

### Customer

```typescript
{
  _id: ObjectId,
  customerId: string,            // auto-generated e.g. 'CUST-0001'
  fullname: string,
  email: string | null,
  phone: string,
  address: string | null,
  customerType: 'individual' | 'business',
  creditLimit: number,           // max amount they are allowed to owe
  currentBalance: number,        // current amount they owe (0 = fully paid)
  totalSpent: number,            // lifetime spend — updated on each completed sale
  createdAt: Date,
  updatedAt: Date
}
```

### Supplier

```typescript
{
  _id: ObjectId,
  name: string,
  contactPerson: string | null,
  phone: string | null,
  address: string | null,
  createdAt: Date,
  updatedAt: Date
}
```

### Product

```typescript
{
  _id: ObjectId,
  name: string,
  brand: string | null,
  location: string | null,       // physical shelf or area in the store
  unit: string,                  // 'pcs', 'kg', 'litre', 'carton', etc.
  SKU: string,                   // unique — format: P001, P002...
  currentStock: number,          // NEVER set directly — only via stockMovement writes
  reorderLevel: number,          // alert fires when currentStock <= this value
  preferredStockLevel: number,   // target stock — used to compute suggestedOrder
  purchaseCost: number,          // cost price from supplier
  sellingPrice: number,
  supplierId: ObjectId | null,   // ref: 'Supplier'
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Sale

```typescript
{
  _id: ObjectId,
  invoiceId: string,             // 'JCC-20250817-0001' — generated by invoiceService
  salesPersonId: ObjectId,       // ref: 'User'
  customerId: ObjectId | null,   // ref: 'Customer' — null for walk-in customers
  customerSnapshot: {            // stored at time of sale in case customer is later edited
    name: string,
    phone: string
  },
  items: [
    {
      productId: ObjectId,       // ref: 'Product'
      productName: string,       // snapshot at time of sale
      quantity: number,
      unitPrice: number,         // selling price at time of sale
      total: number              // quantity * unitPrice
    }
  ],
  payments: [
    {
      method: 'cash' | 'pos' | 'bank_transfer',
      amount: number,
      reference: string | null   // POS slip ref or bank transfer ref; null for cash
    }
  ],
  // RULE: sum(payments[].amount) must === grandTotal before saving
  subTotal: number,              // sum of all item totals before discount and VAT
  discountAmount: number,        // absolute value of discount applied (0 if none)
  vatRate: number,               // VAT % copied from settings at time of sale
  vatAmount: number,             // (subTotal - discountAmount) * (vatRate / 100)
  grandTotal: number,            // subTotal - discountAmount + vatAmount
  amountPaid: number,            // sum of payments[].amount
  paymentStatus: 'paid' | 'partial' | 'pending',
  notes: string | null,
  createdAt: Date,
  updatedAt: Date
}
```

### StockMovement

```typescript
{
  _id: ObjectId,
  productId: ObjectId,           // ref: 'Product'
  productName: string,           // snapshot
  movementType: 'sale' | 'receive' | 'adjustment' | 'return',
  quantityChange: number,        // positive = stock added, negative = stock removed
  stockBefore: number,           // currentStock before this movement
  stockAfter: number,            // currentStock after this movement
  referenceId: ObjectId | null,  // ref to Sale._id or Adjustment._id
  referenceModel: 'Sale' | 'Adjustment' | null,
  performedBy: ObjectId,         // ref: 'User'
  notes: string | null,
  createdAt: Date
}
// INDEX: { productId: 1, createdAt: -1 }
```

### Adjustment

```typescript
{
  _id: ObjectId,
  productId: ObjectId,           // ref: 'Product'
  adjustmentType: 'damage' | 'theft' | 'return' | 'correction' | 'initial_count' | 'supplier_return',
  quantityChange: number,        // positive or negative
  reason: string,                // free-text explanation required
  performedBy: ObjectId,         // ref: 'User'
  createdAt: Date
}
```

### AuditLog

```typescript
{
  _id: ObjectId,
  timestamp: Date,
  userId: ObjectId,              // ref: 'User'
  userSnapshot: string,          // 'John Doe (Manager)' — snapshot at time of action
  action: string,                // e.g. 'CREATE_SALE', 'UPDATE_USER', 'ADJUST_STOCK'
  details: string,               // human-readable description of what changed
  category: 'sales' | 'inventory' | 'customers' | 'users' | 'settings' | 'auth' | 'backup',
  createdAt: Date
}
```

### Settings

```typescript
// Exactly ONE document in this collection — always upsert, never insert a second
{
  _id: ObjectId,
  business: {
    storeName: string,
    address: string,
    phone: string,
    email: string,
    logoUrl: string | null
  },
  invoice: {
    prefix: string,              // e.g. 'JCC'
    startingNumber: number,      // used for initial counter seed
    paymentTerms: string,        // e.g. 'Payment due on receipt'
    notes: string | null         // footer text printed on every invoice
  },
  system: {
    vatEnabled: boolean,
    vatRate: number,             // e.g. 7.5 (stored as percent)
    currency: string,            // e.g. 'NGN'
    sessionTimeoutMinutes: number,
    managerApprovalDiscountThreshold: number  // e.g. 15 — discounts above this need approval
  },
  backup: {
    scheduleEnabled: boolean,
    scheduleFrequency: 'daily' | 'weekly' | 'monthly' | null,
    lastBackupAt: Date | null
  },
  updatedAt: Date
}
```

### Counter (for invoice sequences)

```typescript
// Used by invoiceService to generate daily sequential invoice numbers safely
{
  _id: string,     // e.g. 'invoice-2025-08-17'
  seq: number      // incremented with findOneAndUpdate + $inc: { seq: 1 }
}
```

---

## API Overview

All routes are prefixed with `/api`. Protected routes require:

```
Authorization: Bearer <access_token>
```

```

USERS --done
GET    /api/users                          [users.manage]
POST   /api/users                          [users.manage]
PUT    /api/users/:id                      [users.manage]
DELETE /api/users/:id                      [users.manage]
PATCH  /api/users/:id/status               [users.manage]

ROLES --done
GET    /api/roles                          [users.manage]
POST   /api/roles                          [users.manage]
PUT    /api/roles/:id                      [users.manage]
DELETE /api/roles/:id                      [users.manage]  — blocked if isDefault: true

CUSTOMERS --done
GET    /api/customers                      [customers.view]
POST   /api/customers                      [customers.manage]
GET    /api/customers/:id                  [customers.view]
PUT    /api/customers/:id                  [customers.manage]
GET    /api/customers/:id/transactions     [customers.view]

PRODUCTS --done
GET    /api/products                       [inventory.view]  ?search=&brand=&location=
POST   /api/products                       [inventory.manage]
GET    /api/products/:id                   [inventory.view]
PUT    /api/products/:id                   [inventory.manage]
DELETE /api/products/:id                   [inventory.manage]

SUPPLIERS --done
GET    /api/suppliers                      [inventory.view]
POST   /api/suppliers                      [inventory.manage]
PUT    /api/suppliers/:id                  [inventory.manage]
DELETE /api/suppliers/:id                  [inventory.manage]

SETTINGS --done
GET    /api/settings                       [authenticated]
PUT    /api/settings                       [settings.manage]

AUDIT LOGS -- done
GET    /api/audit-logs                     [audit.view]    ?from=&to=&category=&userId=
GET    /api/audit-logs/export              [audit.view]

INVENTORY --done
POST   /api/inventory/receive              [inventory.receive] → adds stock + writes StockMovement
POST   /api/inventory/adjust               [inventory.adjust]  → corrects stock + writes StockMovement + Adjustment
GET    /api/inventory/reorder-alerts       [inventory.view]    → products where currentStock <= reorderLevel
GET    /api/inventory/movements            [inventory.view]    → stock movement log ?from=&to=&productId=


REPORTS
GET    /api/reports/sales                  [reports.view]  ?from=&to=
GET    /api/reports/products               [reports.view]  ?from=&to=
GET    /api/reports/payment-methods        [reports.view]  ?from=&to=
GET    /api/reports/stock-movements        [reports.view]  ?from=&to=

DASHBOARD
GET    /api/dashboard/summary              [dashboard.view] → returns: todaySales, cashInRegister, pendingPaymentsCount, lowStockCount, recentTransactions[], lowStockItems[]

AUTH
POST   /api/auth/login                     → { accessToken, refreshToken, user }
POST   /api/auth/refresh                   → { accessToken }
POST   /api/auth/logout
POST   /api/auth/change-password           [authenticated]

SALES
GET    /api/sales                          [transactions.view] ?from=&to=&method=&customerId=
POST   /api/sales                          [pos.operate]       → creates sale + deducts stock + writes StockMovements
GET    /api/sales/:id                      [transactions.view]
GET    /api/sales/:id/invoice              [transactions.view] → full invoice data for PDF render/print



BACKUP
POST   /api/backup/export/customers        [backup.manage] → CSV download
POST   /api/backup/export/inventory        [backup.manage] → CSV download
POST   /api/backup/export/full             [backup.manage] → JSON dump
POST   /api/backup/restore                 [backup.manage] → upload + restore
GET    /api/backup/schedule                [backup.manage]
PUT    /api/backup/schedule                [backup.manage]
```

---

## Roles & Permissions

```
BUILT-IN ROLES (isDefault: true — cannot be deleted):

Admin     → all permissions
Manager   → all except: users.manage, settings.manage, backup.manage
Cashier   → dashboard.view, pos.operate, pos.discount.small, transactions.view,
            customers.view, inventory.view

CUSTOM ROLES → any combination of the permissions below
```

| Permission           | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| `dashboard.view`     | View dashboard                                                 |
| `pos.operate`        | Create sales at POS                                            |
| `pos.discount.small` | Apply discounts without approval                               |
| `pos.discount.large` | Apply large discounts (may need manager approval per settings) |
| `pos.refund`         | Process refunds                                                |
| `transactions.view`  | View all transactions                                          |
| `inventory.view`     | View inventory, stock levels, reorder alerts                   |
| `inventory.receive`  | Receive new stock from suppliers                               |
| `inventory.adjust`   | Perform stock adjustments                                      |
| `inventory.manage`   | Add/edit/delete products and suppliers                         |
| `customers.view`     | View customer list and profiles                                |
| `customers.manage`   | Add and edit customers                                         |
| `reports.view`       | View all reports and analytics                                 |
| `users.manage`       | Create, edit, suspend users and manage roles                   |
| `settings.manage`    | Update system settings                                         |
| `audit.view`         | View and export audit logs                                     |
| `backup.manage`      | Export data and manage backup schedule                         |

---

## Invoice Format

```
{PREFIX}-{YYYYMMDD}-{SEQUENCE}
Example: JCC-20250817-0001
```

- Prefix pulled from `settings.invoice.prefix`
- Sequence resets daily, zero-padded to 4 digits
- Generated atomically using the `Counter` collection with `findOneAndUpdate + $inc` to prevent duplicate IDs under concurrent requests
- Logic lives in `services/invoiceService.ts`

---

## TODO — Categorized by Difficulty

### 🟢 Easy (1–3 hours each)

These are low-hanging fruit — do these first to build a solid foundation.

- [ ] Add `timestamps: true` to all Mongoose schemas (auto `createdAt` + `updatedAt`)
- [ ] Add MongoDB indexes: `sales.createdAt`, `stockMovements.productId`, `stockMovements.createdAt`, `customers.phone`
- [ ] Standardise all API responses using `response.ts` helper: `{ success, data, message, error }`
- [ ] Add `.env` validation on startup — throw a clear error if required variables are missing
- [ ] Implement the `logAudit(userId, action, details, category)` utility and wire it into every write controller
- [ ] Add product text search endpoint: filter by name, SKU, brand via query param
- [ ] Add `mustChangePassword: boolean` field to User — set `true` on creation, clear on first successful password change
- [ ] Add `isDefault` guard on role deletion route — return 400 if attempting to delete a built-in role
- [ ] Seed script for built-in roles (Admin, Manager, Cashier) and a default Admin user on first run
- [ ] Return `daysLeft` and `suggestedOrder` alongside each product in the inventory list endpoint

### 🟡 Medium (half a day to a full day each)

These require more thought but are straightforward to implement in isolation.

- [ ] **Refresh token flow** — `/api/auth/refresh` endpoint with separate refresh token stored securely; access token short-lived (8h), refresh token longer (7d)
- [ ] **Split payment server-side validation** — before saving a sale, assert `sum(payments[].amount) === grandTotal`; return 400 with clear error if not
- [ ] **Customer balance tracking** — on sale create: if `paymentStatus` is `partial` or `pending`, increment `customer.currentBalance` by the owed amount. On full payment, set balance to 0 and update `totalSpent`
- [ ] **Stock deduction on sale** — when `POST /api/sales` is called, loop through `items`, write one `StockMovement` per item, and decrement `product.currentStock` accordingly
- [ ] **Receive stock flow** — `POST /api/inventory/receive` increments `product.currentStock`, writes a `StockMovement` with `movementType: 'receive'`, and logs to audit
- [ ] **Invoice PDF generation** — `invoiceService.generatePDF(saleId)` using pdfkit; returns a buffer; mounted on `GET /api/sales/:id/invoice` with `Content-Type: application/pdf`
- [ ] **Reorder alerts endpoint** — returns products where `currentStock <= reorderLevel`, each decorated with `daysLeft` and `suggestedOrder` computed by `stockService`
- [ ] **Counter-based invoice sequence** — safe daily sequence using `Counter` collection and `findOneAndUpdate + $inc + upsert: true` to prevent duplicates under concurrent requests
- [ ] **RBAC middleware** — `checkPermission('permission.string')` middleware; reads `req.user.role.permissions`; returns 403 with clear message if permission is missing
- [ ] **Manager approval for large discounts** — if `discountAmount / subTotal * 100 > settings.managerApprovalDiscountThreshold`, require a manager's token in request header or reject

### 🔴 Hard (multiple days each)

These are what separates a project from a product. Plan these carefully.

- [ ] **Scheduled backups with node-cron** — background job that runs on configured frequency (`daily`, `weekly`, `monthly`), exports collections to JSON/CSV, stores output locally or to cloud storage. Update `settings.backup.lastBackupAt` after each run. Lives in `backupService.ts`
- [ ] **Full report aggregation pipelines** — MongoDB `$aggregate` pipelines with date bucketing, `$group`, and `$lookup` across collections for: daily sales breakdown, per-product analysis, payment method breakdown, stock movement summary. These need careful date range handling and timezone awareness
- [ ] **Session timeout enforcement tied to settings** — JWT expiry should dynamically reflect `settings.system.sessionTimeoutMinutes`. When the setting changes, newly issued tokens use the new expiry. Pair with refresh token strategy so cashiers aren't logged out mid-transaction
- [ ] **Restore from backup** — parse uploaded CSV/JSON, safely re-insert or upsert without creating duplicate records. Needs conflict resolution logic and rollback on partial failure
- [ ] **Partial payment top-up flow** — allow a customer to pay off an outstanding balance after the initial sale. `PATCH /api/sales/:id/payment` accepts additional payment, recalculates `amountPaid`, updates `paymentStatus` to `paid` when fully settled, and decrements `customer.currentBalance`
- [ ] **Concurrent sale safety** — prevent race conditions when two cashiers sell the last unit of the same product simultaneously. Wrap the sale creation flow (stock check → deduct → write StockMovement) in a MongoDB session transaction using `session.startTransaction()` with optimistic concurrency check

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: describe your change'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT License. See `LICENSE` for details.
