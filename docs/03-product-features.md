# Chapter 3 — Product Features

> Back to [Index](./README.md) | Prev ← [Product Scope](./02-product-scope.md) | Next → [AI Features](./04-ai-features.md)

---

## 3.1 Authentication `[MVP]`

### 3.1.1 Registration

| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| Full Name | String | 2–100 chars | ✅ |
| Email | String | Valid email format, unique | ✅ |
| Password | String | Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special | ✅ |
| Confirm Password | String | Must match password | ✅ |
| Phone Number | String | Indian mobile (10 digits) | Optional |
| Agree to Terms | Boolean | Must be true | ✅ |

**Flow:**
```
User fills form → Client-side validation (Zod) → POST /api/v1/auth/register
→ Server validates → Create user (status: UNVERIFIED) → Send verification email
→ User clicks link → GET /api/v1/auth/verify-email?token={token}
→ User status → ACTIVE → Redirect to organization setup
```

**Business Rules:**
- Email must be unique across the platform (not per organization)
- Password is hashed with BCrypt (cost factor 12) before storage
- Verification token expires in 24 hours
- User cannot login until email is verified
- Rate limit: 5 registration attempts per IP per hour

### 3.1.2 Login

| Field | Type | Validation |
|-------|------|-----------|
| Email | String | Valid email format |
| Password | String | Non-empty |

**Flow:**
```
User submits credentials → POST /api/v1/auth/login
→ Validate credentials → Check user status (ACTIVE required)
→ Generate JWT access token (15 min expiry) + Refresh token (7 day expiry)
→ Return tokens + user profile + organizations list
→ Client stores access token in memory, refresh token in httpOnly cookie
```

**Security Measures:**
- Account lockout after 5 failed attempts (30-minute cooldown)
- Login activity logged (IP, User-Agent, timestamp, success/failure)
- Refresh token rotation: each refresh invalidates the old token
- Concurrent session limit: 5 active sessions per user (configurable)

### 3.1.3 Forgot Password

**Flow:**
```
User enters email → POST /api/v1/auth/forgot-password
→ If email exists: send reset email (always return 200 to prevent enumeration)
→ User clicks link → GET /api/v1/auth/reset-password?token={token}
→ Show reset form → POST /api/v1/auth/reset-password
→ Validate token (1 hour expiry) → Update password → Invalidate all sessions
```

### 3.1.4 JWT Token Architecture

```
Access Token (JWT, RS256)
├── Header: { alg: "RS256", typ: "JWT" }
├── Payload:
│   ├── sub: "user_uuid"
│   ├── email: "user@example.com"
│   ├── name: "User Name"
│   ├── org_id: "org_uuid" (currently selected organization)
│   ├── role: "OWNER" | "ADMIN" | "MANAGER" | "ACCOUNTANT" | "STAFF"
│   ├── permissions: ["INVOICE_CREATE", "INVOICE_READ", ...]
│   ├── iat: 1720000000
│   ├── exp: 1720000900 (15 minutes)
│   └── iss: "billos"
└── Signature: RS256(header.payload, private_key)

Refresh Token
├── Stored in: httpOnly, Secure, SameSite=Strict cookie
├── Expiry: 7 days
├── Rotation: New refresh token issued on each use
├── Family tracking: Detect token reuse attacks
└── Revocation: Stored in database, can be invalidated
```

### 3.1.5 Session Management

| Feature | Detail |
|---------|--------|
| Max concurrent sessions | 5 per user (configurable per organization) |
| Session listing | Users can view all active sessions (device, IP, last active) |
| Remote logout | Users can terminate any session remotely |
| Force logout | Admins can force-logout any user in their organization |
| Session timeout | Idle timeout: 30 minutes (configurable) |
| Token refresh | Silent refresh 1 minute before access token expiry |

---

## 3.2 Organization Management `[MVP]`

### 3.2.1 Multi-Tenant Architecture

billOS is a **multi-tenant SaaS** where each organization is a fully isolated tenant.

```
┌────────────────────────────────────────────────┐
│                   User: Rakesh                 │
│                                                │
│  ┌──────────────┐  ┌──────────────────────┐    │
│  │  Org 1:       │  │  Org 2:              │    │
│  │  Rakesh Store │  │  Rakesh Wholesale    │    │
│  │  Role: OWNER  │  │  Role: OWNER         │    │
│  └──────────────┘  └──────────────────────┘    │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │  Org 3: Client's Business               │  │
│  │  Role: ACCOUNTANT (invited by client)    │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

**Key Principles:**
- One user can belong to multiple organizations with different roles
- All business data is scoped by `organization_id`
- Every database query includes `WHERE organization_id = ?` (enforced at JPA level)
- Organization switching is instant (JWT refresh with new `org_id` claim)
- No data leakage between organizations — validated at service + repository layers

### 3.2.2 Company Profile

| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| Organization Name | String | 2–200 chars | ✅ |
| Legal Business Name | String | 2–200 chars | ✅ |
| Business Type | Enum | SOLE_PROPRIETORSHIP, PARTNERSHIP, LLP, PVT_LTD, PUBLIC_LTD, TRUST, SOCIETY, OTHER | ✅ |
| Industry | Enum | RETAIL, WHOLESALE, MANUFACTURING, SERVICES, DISTRIBUTION, OTHER | ✅ |
| Logo | Image | PNG/JPG, max 2MB, min 200x200px | Optional |
| Address Line 1 | String | Max 200 chars | ✅ |
| Address Line 2 | String | Max 200 chars | Optional |
| City | String | Max 100 chars | ✅ |
| State | Enum | Indian state code (01-37) | ✅ |
| PIN Code | String | 6-digit Indian PIN | ✅ |
| Country | String | Default: India | ✅ |
| Phone | String | Indian phone number | ✅ |
| Email | String | Valid email | ✅ |
| Website | String | Valid URL | Optional |

### 3.2.3 GST Details

| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| GSTIN | String | 15-char GSTIN format (regex validated) | ✅ |
| GST Registration Type | Enum | REGULAR, COMPOSITION, UNREGISTERED, CONSUMER, OVERSEAS, SEZ | ✅ |
| Legal Name (as per GST) | String | Auto-fetched from GSTIN API | Auto |
| Trade Name | String | Max 200 chars | Optional |
| State Code | String | Extracted from GSTIN (positions 1-2) | Auto |
| PAN | String | Extracted from GSTIN (positions 3-12) | Auto |
| Registration Date | Date | GST registration date | Optional |
| E-invoice Enabled | Boolean | Based on turnover threshold | ✅ |
| E-way Bill Enabled | Boolean | Based on business type | Optional |
| Composition Scheme Rate | Decimal | If COMPOSITION type | Conditional |

**GSTIN Validation Regex:**
```regex
^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$
```

### 3.2.4 Branch Management

| Feature | Detail |
|---------|--------|
| Multi-branch | One organization can have multiple branches |
| Branch GSTIN | Each branch can have its own GSTIN (or share parent's) |
| Branch address | Separate shipping/billing address per branch |
| Branch users | Users can be assigned to specific branches |
| Default branch | One branch marked as primary/HQ |
| Branch-level reporting | Filter reports by branch |

### 3.2.5 Financial Year Configuration

| Setting | Detail |
|---------|--------|
| Financial year start | Configurable (default: April 1) |
| Financial year format | FY 2026–27 |
| Multi-year support | Historical data across financial years |
| Year-end closing | Lock previous FY, carry forward balances |
| Invoice numbering | Resets or continues per FY (configurable) |

---

## 3.3 User Management & RBAC `[MVP]`

### 3.3.1 Role Definitions

| Role | Description | Typical User |
|------|-------------|-------------|
| **OWNER** | Full control. Can delete organization. Cannot be removed. | Business founder |
| **ADMIN** | Full control except delete organization and manage owner. | Trusted manager/partner |
| **MANAGER** | Can manage daily operations, users (below their role), view reports. | Branch manager |
| **ACCOUNTANT** | Financial operations: invoices, payments, expenses, reports. No user management. | CA, bookkeeper |
| **STAFF** | Limited: create sales, view products, basic data entry. | Sales person, counter staff |

### 3.3.2 Permission Matrix

| Permission | OWNER | ADMIN | MANAGER | ACCOUNTANT | STAFF |
|-----------|-------|-------|---------|------------|-------|
| **Organization** | | | | | |
| View organization | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit organization | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage GST settings | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Users** | | | | | |
| Invite users | ✅ | ✅ | ✅ (Staff only) | ❌ | ❌ |
| Edit user roles | ✅ | ✅ (below Admin) | ❌ | ❌ | ❌ |
| Remove users | ✅ | ✅ (below Admin) | ❌ | ❌ | ❌ |
| View user activity | ✅ | ✅ | ✅ (own team) | ❌ | ❌ |
| **Customers** | | | | | |
| Create customer | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit customer | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete customer | ✅ | ✅ | ✅ | ❌ | ❌ |
| View customer ledger | ✅ | ✅ | ✅ | ✅ | ❌ |
| Set credit limit | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Suppliers** | | | | | |
| Create supplier | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit supplier | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete supplier | ✅ | ✅ | ✅ | ❌ | ❌ |
| View supplier ledger | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Products** | | | | | |
| Create product | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit product | ✅ | ✅ | ✅ | ❌ | ❌ |
| Delete product | ✅ | ✅ | ✅ | ❌ | ❌ |
| View products | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Inventory** | | | | | |
| View stock | ✅ | ✅ | ✅ | ✅ | ✅ |
| Adjust stock | ✅ | ✅ | ✅ | ❌ | ❌ |
| Transfer stock | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Purchases** | | | | | |
| Create purchase | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit purchase | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete purchase | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve purchase | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Sales** | | | | | |
| Create sale | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit sale | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete sale | ✅ | ✅ | ❌ | ❌ | ❌ |
| Give discount | ✅ | ✅ | ✅ | ❌ | ❌ (configurable) |
| **Invoices** | | | | | |
| Create invoice | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit invoice | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete/void invoice | ✅ | ✅ | ❌ | ❌ | ❌ |
| Send invoice | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Payments** | | | | | |
| Record payment | ✅ | ✅ | ✅ | ✅ | ❌ |
| View payments | ✅ | ✅ | ✅ | ✅ | ❌ |
| Delete payment | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Reports** | | | | | |
| View sales reports | ✅ | ✅ | ✅ | ✅ | ❌ |
| View financial reports | ✅ | ✅ | ❌ | ✅ | ❌ |
| View GST reports | ✅ | ✅ | ❌ | ✅ | ❌ |
| Export reports | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Settings** | | | | | |
| View settings | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit settings | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Audit Logs** | | | | | |
| View audit logs | ✅ | ✅ | ❌ | ❌ | ❌ |

### 3.3.3 User Invitation Flow

```
Admin clicks "Invite User" → Enter email + select role + select branches
→ POST /api/v1/users/invite → System sends invitation email
→ Invitee clicks link → If new user: register → If existing user: accept invitation
→ User added to organization with specified role
→ Invitation expires in 7 days if not accepted
```

---

## 3.4 Dashboard `[MVP – Basic | P2 – Advanced]`

### MVP Dashboard Widgets

| Widget | Data | Refresh |
|--------|------|---------|
| **Revenue Card** | Total sales (current month / FY) with trend arrow | Real-time |
| **Expenses Card** | Total purchases + expenses (current month / FY) | Real-time |
| **Profit Card** | Revenue – Expenses (current month / FY) | Real-time |
| **Pending Receivables** | Total outstanding from customers | Real-time |
| **Pending Payables** | Total outstanding to suppliers | Real-time |
| **Recent Transactions** | Last 10 invoices/payments with status | Real-time |
| **Low Stock Alerts** | Products below reorder level (count + list) | Real-time |
| **Quick Actions** | Create Invoice, Add Sale, Add Product, Record Payment | Static |

### P2 Dashboard (Advanced)

| Widget | Data |
|--------|------|
| **Sales Trend Graph** | Monthly sales bar/line chart (last 12 months) |
| **Top Customers** | Top 5 by revenue (current FY) |
| **Top Products** | Top 5 by quantity/revenue sold |
| **Cash Flow Chart** | Inflow vs outflow over time |
| **Inventory Value** | Total stock value by category |
| **Aging Receivables** | 0-30, 31-60, 61-90, 90+ days breakdown |
| **GST Summary** | Output tax vs Input tax for current period |
| **KPI Cards** | Gross margin %, inventory turnover, days sales outstanding |

---

## 3.5 Customer Management `[MVP]`

### 3.5.1 Customer Entity

| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| Customer Code | String | Auto-generated (CUST-0001) or custom | Auto |
| Display Name | String | 2–200 chars | ✅ |
| Legal Name | String | As per GST registration | Optional |
| Customer Type | Enum | BUSINESS, INDIVIDUAL | ✅ |
| GSTIN | String | Valid GSTIN format | Conditional (if B2B) |
| PAN | String | 10-char PAN format | Optional |
| Email | String | Valid email | Optional |
| Phone | String | Indian phone number | ✅ |
| Billing Address | Address | Full Indian address | ✅ |
| Shipping Address | Address | Full Indian address (can be same as billing) | Optional |
| Credit Limit | Decimal | ≥ 0 | Optional (default: 0 = no limit) |
| Payment Terms | Integer | Days (default: 30) | Optional |
| Opening Balance | Decimal | Carry-forward amount | Optional |
| Notes | Text | Max 1000 chars | Optional |
| Tags | String[] | Custom tags for categorization | Optional |
| Status | Enum | ACTIVE, INACTIVE | Auto |

### 3.5.2 Customer Ledger

The customer ledger is a real-time, auto-calculated view showing all financial transactions:

| Transaction Type | Debit (Customer Owes) | Credit (Customer Paid) |
|-----------------|----------------------|----------------------|
| Sale Invoice | Invoice amount | — |
| Credit Note | — | Credit note amount |
| Payment Received | — | Payment amount |
| Debit Note | Additional charges | — |
| Opening Balance | If positive | If negative |

**Ledger Balance = Sum(Debits) – Sum(Credits)**

### 3.5.3 Customer Features

| Feature | Description |
|---------|-------------|
| **Outstanding Tracker** | Real-time balance owed by customer |
| **Credit Limit Enforcement** | Warn/block sales when credit limit exceeded |
| **Purchase History** | All invoices, payments, returns for this customer |
| **Statement Generation** | PDF statement of account for any date range |
| **Aging Analysis** | 0-30, 31-60, 61-90, 90+ day receivable breakdown |
| **Bulk Import** | CSV/Excel import for customer data migration |
| **Duplicate Detection** | Flag potential duplicates by GSTIN, phone, or name |

---

## 3.6 Supplier Management `[MVP]`

Mirrors Customer Management with supplier-specific additions:

| Additional Field | Type | Description |
|-----------------|------|-------------|
| Payment Terms | Integer | Default days for payment |
| Bank Details | Object | Account number, IFSC, bank name (for payments) |
| TDS Applicable | Boolean | Whether TDS deduction applies |
| TDS Section | Enum | 194C, 194J, etc. (if applicable) |

**Supplier Ledger:** Inverse of customer ledger — tracks what the organization owes to suppliers.

---

## 3.7 Product Management `[MVP]`

### 3.7.1 Product Entity

| Field | Type | Validation | Required |
|-------|------|-----------|----------|
| Product Code | String | Auto (SKU-0001) or custom | Auto |
| Name | String | 2–200 chars | ✅ |
| Description | Text | Max 2000 chars | Optional |
| Type | Enum | GOODS, SERVICE | ✅ |
| Category | Reference | Link to ProductCategory | Optional |
| Sub-category | Reference | Link to ProductSubCategory | Optional |
| Brand | String | Max 100 chars | Optional |
| HSN/SAC Code | String | 4-8 digit HSN (goods) or SAC (services) | ✅ |
| Unit of Measure | Enum | PCS, KG, LTR, MTR, BOX, DOZ, SET, etc. | ✅ |
| **Pricing** | | | |
| Purchase Price | Decimal | ≥ 0 | ✅ |
| Selling Price | Decimal | ≥ 0 | ✅ |
| MRP | Decimal | ≥ Selling Price | Optional |
| Minimum Selling Price | Decimal | Floor price for discount control | Optional |
| Wholesale Price | Decimal | Bulk pricing | Optional |
| **Tax** | | | |
| GST Rate | Enum | 0%, 0.25%, 3%, 5%, 12%, 18%, 28% | ✅ |
| Cess Rate | Decimal | Additional cess (if applicable) | Optional |
| Tax Inclusive Pricing | Boolean | Is the selling price inclusive of GST? | ✅ |
| **Inventory** | | | |
| Track Inventory | Boolean | Enable stock tracking | ✅ |
| Opening Stock | Integer | Initial quantity | Optional |
| Reorder Level | Integer | Alert when stock falls below | Optional |
| Reorder Quantity | Integer | Suggested reorder amount | Optional |
| Batch Tracking | Boolean | Enable batch/lot tracking | Optional |
| Expiry Tracking | Boolean | Enable expiry date tracking | Optional |
| **Media** | | | |
| Images | Image[] | Max 5 images, 2MB each | Optional |

### 3.7.2 Product Categories

Two-level hierarchy:
```
Category (e.g., "Electronics")
└── Sub-category (e.g., "Mobile Accessories")
    └── Product (e.g., "USB-C Cable 1m")
```

---

## 3.8 Inventory Management `[MVP]`

### 3.8.1 Stock Operations

| Operation | Trigger | Effect |
|-----------|---------|--------|
| **Stock In** | Purchase bill, stock adjustment, transfer in | Increase quantity |
| **Stock Out** | Sale invoice, stock adjustment, transfer out, damage | Decrease quantity |
| **Stock Adjustment** | Manual correction | Increase or decrease |
| **Stock Transfer** | Inter-warehouse/branch | Decrease at source, increase at destination |

### 3.8.2 Valuation Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| **FIFO** (First In, First Out) | Oldest stock valued first | Most common, GST-compliant |
| **Weighted Average** | Running average cost | Simpler, suitable for homogeneous goods |

### 3.8.3 Inventory Features

| Feature | Description |
|---------|-------------|
| **Real-time Stock View** | Current quantity, value, and location per product |
| **Low Stock Alerts** | Dashboard notification when stock < reorder level |
| **Stock Aging** | Days since last movement per product |
| **Batch/Lot Tracking** | Track purchase batch, manufacturing date, expiry |
| **Expiry Alerts** | Notify when products approaching expiry (30/15/7 days) |
| **Stock Report** | Summary, detailed, movement, valuation reports |
| **Barcode Support** | Generate/print barcodes, scan for stock operations (P4) |

---

## 3.9 Warehouse Management `[MVP – Basic | P2 – Full]`

### MVP (Basic)

| Feature | Description |
|---------|-------------|
| Default Warehouse | One warehouse per organization (auto-created) |
| Warehouse Name/Address | Basic identification |
| Stock per Warehouse | Track quantity at warehouse level |

### P2 (Full)

| Feature | Description |
|---------|-------------|
| Multi-Warehouse | Unlimited warehouses per organization |
| Stock Transfer | Move stock between warehouses with transfer documents |
| Warehouse-level Reporting | Filter all reports by warehouse |
| Bin/Rack Location | Track within-warehouse location |
| Warehouse Manager Role | Assign users to manage specific warehouses |

---

## 3.10 Purchase Management `[MVP]`

### 3.10.1 Purchase Document Flow

```
Purchase Order (PO) → Goods Received Note (GRN) → Purchase Bill → Payment
        ↓                       ↓                       ↓
   [Optional]            [Stock increases]        [Supplier ledger
                                                   updated]
```

### 3.10.2 Purchase Order

| Feature | Description |
|---------|-------------|
| Supplier selection | With auto-fill of address and GSTIN |
| Line items | Product, quantity, rate, discount, tax, amount |
| Tax calculation | CGST + SGST (intra-state) or IGST (inter-state) auto-calculated |
| Discount | Per-line percentage/amount or overall discount |
| Additional charges | Freight, loading, etc. |
| Terms & conditions | Configurable templates |
| Status flow | DRAFT → SENT → PARTIALLY_RECEIVED → FULLY_RECEIVED → CANCELLED |
| Print/PDF | Generate PDF for sharing with supplier |

### 3.10.3 Purchase Bill

| Feature | Description |
|---------|-------------|
| Link to PO | Optional — can create standalone purchase bill |
| Supplier invoice number | Track supplier's invoice reference |
| Supplier invoice date | Date on supplier's invoice |
| Auto stock update | Stock increases on bill creation |
| ITC tracking | Input Tax Credit amount auto-calculated |
| Payment tracking | Record full/partial payments against bill |
| Return handling | Purchase return creates debit note |

---

## 3.11 Sales Management `[MVP]`

### 3.11.1 Sales Document Flow

```
Quotation → Sales Order → Delivery Challan → Invoice → Payment
    ↓           ↓              ↓                ↓
[Optional]  [Optional]   [Stock decreases]  [Revenue recorded,
                                             customer ledger
                                             updated]
```

### 3.11.2 Sales Document Features

| Feature | Description |
|---------|-------------|
| Customer selection | With auto-fill of address and GSTIN |
| Line items | Product, quantity, rate, discount, tax, amount |
| Tax calculation | CGST + SGST (intra-state) or IGST (inter-state) auto |
| Credit limit check | Warn if sale exceeds customer's credit limit |
| Discount control | Block discount below minimum selling price |
| Multiple tax rates | Support different GST rates on different line items |
| Round off | Auto round-off total to nearest rupee |
| Notes | Internal notes (not printed) + customer-facing terms |
| Status flow | DRAFT → CONFIRMED → DELIVERED → INVOICED → PAID → CANCELLED |
| Conversion | Quotation → Order → Challan → Invoice (one-click) |

---

## 3.12 GST Billing `[MVP]`

### 3.12.1 Tax Invoice Rules

| Rule | Implementation |
|------|---------------|
| **Intra-state supply** (same state) | CGST (50%) + SGST (50%) of GST rate |
| **Inter-state supply** (different state) | IGST (100%) of GST rate |
| **Reverse charge** | Mark on invoice, no tax collected from customer |
| **Exempt supply** | Zero tax, marked as exempt |
| **Nil rated** | Zero tax, different from exempt |
| **Export** | Zero rated with LUT or with IGST |
| **SEZ supply** | Zero rated |
| **Composition scheme** | No tax breakup, "Composition Taxable Person" watermark |

### 3.12.2 Invoice Numbering

```
Format: {PREFIX}/{BRANCH_CODE}/{FY}/{SEQUENCE}
Example: INV/MUM/2627/00001

Rules:
- Sequential, no gaps (GST requirement)
- Resets per financial year (configurable)
- Unique per GSTIN
- Branch-specific series (optional)
- Configurable prefix
```

### 3.12.3 E-Invoice Integration (IRP)

| Step | Detail |
|------|--------|
| 1. Generate JSON | Map invoice data to FORM INV-01 schema |
| 2. Push to IRP | POST to IRP API with auth headers |
| 3. Receive IRN | Store Invoice Reference Number |
| 4. Embed QR | Generate and embed QR code in invoice PDF |
| 5. Auto GSTR-1 | Invoice auto-populated in GSTR-1 |
| 6. Archive | Store signed JSON for 72 months |

### 3.12.4 Credit Note / Debit Note

| Document | Use Case |
|----------|----------|
| **Credit Note** | Sales return, post-sale discount, correction (quantity/price) |
| **Debit Note** | Additional charges, price increase, purchase return |

Both follow the same GST rules and numbering as invoices. Must reference the original invoice number.

---

## 3.13 Invoice Management `[MVP]`

### 3.13.1 Invoice PDF Generation

| Feature | Detail |
|---------|--------|
| Template engine | Server-side PDF generation (iText / OpenPDF) |
| Templates | 3 built-in templates (Classic, Modern, Compact) |
| Custom branding | Logo, colors, footer text |
| Sections | Header (company + customer) → Line items → Tax summary → HSN summary → Bank details → Terms → QR code |
| Format | A4, Thermal (POS receipt in P4) |
| Languages | English (MVP), Hindi (P4) |
| Amount in words | Auto-generated Indian number system ("Twelve Thousand Three Hundred and Forty-Five Rupees Only") |

### 3.13.2 Invoice Actions

| Action | Description |
|--------|-------------|
| Create | New invoice from scratch or convert from quotation/order |
| Edit | Only DRAFT invoices; finalized invoices need credit note |
| Send | Email with PDF attachment + tracking (opened/viewed) |
| Print | Direct print with browser print dialog |
| Download | PDF download |
| Share | Generate shareable link (read-only, expiring) |
| Void | Cancel invoice (with reason), auto-generate credit note |
| Duplicate | Clone invoice for repeat transactions |
| Recurring | Set up recurring invoice schedule (P2) |

---

## 3.14 Payment Management `[MVP – Basic | P2 – Full]`

### MVP (Basic)

| Feature | Description |
|---------|-------------|
| Record payment received | Against specific invoice(s) |
| Record payment made | Against specific purchase bill(s) |
| Payment modes | Cash, Bank Transfer, UPI, Cheque, Credit/Debit Card |
| Partial payment | Pay any amount against an invoice |
| Payment receipt PDF | Printable receipt for customer |
| Advance payment | Record payment before invoice |

### P2 (Full)

| Feature | Description |
|---------|-------------|
| Payment gateway | Online payment link in invoice email |
| Payment reminders | Automated email/SMS for overdue invoices |
| Payment reconciliation | Match bank statement with recorded payments |
| Bulk payment | Pay multiple invoices in one transaction |
| PDC management | Post-dated cheque tracking |

---

## 3.15 Expense Management `[P2]`

| Feature | Description |
|---------|-------------|
| Expense categories | Rent, Salary, Utilities, Travel, Office Supplies, etc. |
| Record expense | Amount, date, category, vendor, payment mode, receipt |
| Receipt upload | Image/PDF upload, OCR extraction (P3) |
| Recurring expenses | Auto-create monthly/weekly expenses |
| Expense reports | By category, vendor, period, employee |
| Approval workflow | Staff submits → Manager approves → Payment recorded |
| Budget tracking | Set monthly budgets per category, alert on exceed |

---

## 3.16 Reports `[MVP – Basic | P2 – Advanced]`

### MVP Reports

| Report | Description | Filters |
|--------|-------------|---------|
| **Sales Register** | All sales with customer, amount, tax, status | Date range, customer, status |
| **Purchase Register** | All purchases with supplier, amount, tax | Date range, supplier, status |
| **Stock Summary** | Current stock quantity and value per product | Category, warehouse |
| **Stock Movement** | In/out history per product | Date range, product |
| **GSTR-1 Report** | B2B, B2C, credit notes formatted for GSTR-1 | Period |
| **GSTR-3B Report** | Tax liability and ITC summary | Period |
| **HSN-wise Summary** | Sales/purchase grouped by HSN code | Period |
| **Outstanding Receivables** | Customer-wise amounts due | As-of date |
| **Outstanding Payables** | Supplier-wise amounts due | As-of date |
| **Profit & Loss** (Basic) | Revenue – Purchases (trading P&L) | Period |

### P2 Reports

| Report | Description |
|--------|-------------|
| **Aging Analysis** | Receivables/payables aged 0-30, 31-60, 61-90, 90+ |
| **Cash Flow Statement** | Inflows and outflows over time |
| **Tax Computation** | GST liability computation worksheet |
| **Expense Report** | Category-wise expense analysis |
| **Inventory Valuation** | Stock value by product/category/warehouse |
| **Sales by Customer** | Revenue contribution per customer |
| **Sales by Product** | Revenue contribution per product |
| **Day Book** | All transactions for a day |
| **Trial Balance** | Debit/credit balance of all accounts |
| **Balance Sheet** (Basic) | Assets and liabilities snapshot |

### Report Features

| Feature | Detail |
|---------|--------|
| Export formats | PDF, Excel (XLSX), CSV |
| Date range picker | Today, this week, this month, this quarter, this FY, custom |
| Drill-down | Click totals to see individual transactions |
| Print | Print-optimized layout |
| Schedule | Auto-generate and email reports (P2) |
| Compare | Period-over-period comparison (P2) |

---

## 3.17 Notification Center `[P2]`

| Channel | Use Cases |
|---------|-----------|
| **In-App** | Low stock, payment due, invoice created, user invited |
| **Email (Resend)** | Invoice delivery, payment reminders, reports, system alerts |
| **Push (FCM)** | Real-time notifications on mobile/desktop |
| **WhatsApp (P4)** | Invoice sharing, payment reminders |

---

## 3.18 Settings `[MVP]`

| Category | Settings |
|----------|----------|
| **Organization** | Name, logo, address, contact info |
| **Tax** | GST rates, HSN defaults, tax-inclusive pricing default |
| **Invoice** | Number format, prefix, template, terms & conditions, bank details, signature |
| **Currency** | Symbol (₹), decimal places (2), number format (Indian) |
| **User Preferences** | Theme (light/dark), language, timezone, date format |
| **Notifications** | Email preferences, alert thresholds |

---

## 3.19 Audit Logs `[MVP]`

### Audit Log Entry

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique log entry ID |
| organization_id | UUID | Tenant scope |
| user_id | UUID | Who performed the action |
| user_name | String | User's display name at time of action |
| action | Enum | CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, VOID, etc. |
| entity_type | String | INVOICE, CUSTOMER, PRODUCT, PAYMENT, etc. |
| entity_id | UUID | ID of affected entity |
| entity_name | String | Display name of affected entity |
| changes | JSONB | Old and new values for UPDATE actions |
| ip_address | String | Client IP |
| user_agent | String | Browser/device info |
| timestamp | Timestamp | When the action occurred |

### Audit Features

| Feature | Detail |
|---------|--------|
| Immutable | Audit logs cannot be edited or deleted |
| Retention | 3 years minimum |
| Search | By user, entity, action, date range |
| Export | CSV export for compliance |
| Change diff | Show old vs new values for edits |

---

> **Next:** [Chapter 4 — AI Features](./04-ai-features.md)
