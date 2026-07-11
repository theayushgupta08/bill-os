# Chapter 9 — API Documentation

> Back to [Index](./README.md) | Prev ← [Database Design](./08-database-design.md) | Next → [UI/UX Design System](./10-ui-ux-design-system.md)

---

## 9.1 API Overview

| Property | Value |
|----------|-------|
| Base URL | `https://api.billos.app/api/v1` |
| Protocol | HTTPS (TLS 1.3) |
| Format | JSON (`application/json`) |
| Auth | Bearer JWT (`Authorization: Bearer <token>`) |
| Docs | OpenAPI 3.0 at `/api/v1/docs` (Swagger UI) |
| Versioning | URL-based (`/api/v1/`, `/api/v2/`) |

---

## 9.2 Authentication Endpoints

### POST `/auth/register`

Register a new user account.

**Request:**
```json
{
  "fullName": "Rakesh Kumar",
  "email": "rakesh@example.com",
  "password": "SecureP@ss123",
  "confirmPassword": "SecureP@ss123",
  "phone": "9876543210",
  "agreeToTerms": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "userId": "a1b2c3d4-...",
    "email": "rakesh@example.com",
    "fullName": "Rakesh Kumar",
    "status": "UNVERIFIED"
  },
  "message": "Registration successful. Please verify your email."
}
```

**Errors:**
| Code | Status | Condition |
|------|--------|-----------|
| `EMAIL_ALREADY_EXISTS` | 409 | Email registered |
| `VALIDATION_ERROR` | 400 | Invalid fields |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many attempts |

---

### POST `/auth/login`

Authenticate and receive tokens.

**Request:**
```json
{
  "email": "rakesh@example.com",
  "password": "SecureP@ss123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "expiresIn": 900,
    "user": {
      "id": "a1b2c3d4-...",
      "email": "rakesh@example.com",
      "fullName": "Rakesh Kumar",
      "status": "ACTIVE"
    },
    "organizations": [
      {
        "id": "org-uuid-1",
        "name": "Rakesh Store",
        "role": "OWNER"
      }
    ]
  }
}
```

**Headers set:** `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth; Max-Age=604800`

---

### POST `/auth/refresh`

Refresh access token using refresh token cookie.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "expiresIn": 900
  }
}
```

---

### POST `/auth/logout`

Invalidate current session.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### POST `/auth/forgot-password`

**Request:** `{ "email": "rakesh@example.com" }`

**Response (200):** Always returns 200 (prevent email enumeration).

---

### POST `/auth/reset-password`

**Request:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecure@123",
  "confirmPassword": "NewSecure@123"
}
```

---

### GET `/auth/verify-email?token={token}`

Verify email address from registration link.

---

## 9.3 Organization Endpoints

### POST `/organizations`

Create a new organization (called after registration).

**Request:**
```json
{
  "name": "Rakesh Store",
  "legalName": "Rakesh Kumar Enterprises",
  "businessType": "SOLE_PROPRIETORSHIP",
  "industry": "RETAIL",
  "gstin": "27AABCU9603R1ZM",
  "gstRegistrationType": "REGULAR",
  "addressLine1": "123 MG Road",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pinCode": "400001",
  "phone": "9876543210",
  "email": "store@rakesh.com"
}
```

**Response (201):** Organization object with auto-created default warehouse and financial year.

### GET `/organizations/{id}`
### PUT `/organizations/{id}`
### DELETE `/organizations/{id}` — OWNER only

### PUT `/organizations/{id}/gst` — Update GST details
### PUT `/organizations/{id}/settings` — Update organization settings

---

## 9.4 Customer Endpoints

### GET `/customers`

List customers with pagination, filtering, and search.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 0 | Page number (0-indexed) |
| `size` | int | 20 | Page size (max 100) |
| `sort` | string | `createdAt,desc` | Sort field and direction |
| `search` | string | | Search in name, code, phone, GSTIN |
| `status` | string | `ACTIVE` | ACTIVE, INACTIVE |
| `hasOutstanding` | boolean | | Filter customers with outstanding > 0 |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cust-uuid-1",
      "customerCode": "CUST-0001",
      "displayName": "Priya Electronics",
      "gstin": "27AABCU9603R1ZM",
      "phone": "9876543210",
      "email": "priya@electronics.com",
      "outstanding": 45000.00,
      "creditLimit": 100000.00,
      "status": "ACTIVE",
      "createdAt": "2026-07-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### POST `/customers`

**Request:**
```json
{
  "displayName": "Priya Electronics",
  "customerType": "BUSINESS",
  "gstin": "27AABCU9603R1ZM",
  "phone": "9876543210",
  "email": "priya@electronics.com",
  "billingAddress": {
    "addressLine1": "456 Station Road",
    "city": "Pune",
    "state": "Maharashtra",
    "stateCode": "27",
    "pinCode": "411001"
  },
  "creditLimit": 100000,
  "paymentTerms": 30
}
```

### GET `/customers/{id}`
### PUT `/customers/{id}`
### DELETE `/customers/{id}`

### GET `/customers/{id}/ledger`

**Query Parameters:** `fromDate`, `toDate`, `page`, `size`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "customerId": "cust-uuid-1",
    "customerName": "Priya Electronics",
    "openingBalance": 0.00,
    "closingBalance": 45000.00,
    "entries": [
      {
        "date": "2026-07-01",
        "type": "INVOICE",
        "referenceNumber": "INV/MUM/2627/00001",
        "referenceId": "inv-uuid-1",
        "debit": 55000.00,
        "credit": 0.00,
        "balance": 55000.00,
        "description": "Sales Invoice"
      },
      {
        "date": "2026-07-05",
        "type": "PAYMENT",
        "referenceNumber": "PAY/2627/00001",
        "referenceId": "pay-uuid-1",
        "debit": 0.00,
        "credit": 10000.00,
        "balance": 45000.00,
        "description": "Payment Received - UPI"
      }
    ]
  }
}
```

### GET `/customers/{id}/invoices` — Customer's invoices
### GET `/customers/{id}/statement` — PDF statement for date range
### POST `/customers/import` — CSV/Excel bulk import

---

## 9.5 Supplier Endpoints

Mirrors customer endpoints at `/suppliers/*` with supplier-specific fields (bank details, TDS).

---

## 9.6 Product Endpoints

### GET `/products`

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Name, code, HSN search |
| `categoryId` | UUID | Filter by category |
| `productType` | string | GOODS, SERVICE |
| `lowStock` | boolean | Only products below reorder level |
| `gstRate` | decimal | Filter by GST rate |

### POST `/products`
### GET `/products/{id}`
### PUT `/products/{id}`
### DELETE `/products/{id}`

### GET `/categories` — List product categories
### POST `/categories` — Create category
### PUT `/categories/{id}`
### DELETE `/categories/{id}`

---

## 9.7 Inventory Endpoints

### GET `/inventory` — Stock summary across all products/warehouses
### GET `/inventory/product/{productId}` — Stock for specific product
### POST `/inventory/adjustments` — Create stock adjustment
### GET `/inventory/movements` — Stock movement history
### POST `/inventory/transfers` — Inter-warehouse transfer

---

## 9.8 Purchase Endpoints

### Purchase Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/purchase-orders` | List with filters |
| POST | `/purchase-orders` | Create PO |
| GET | `/purchase-orders/{id}` | Get PO detail |
| PUT | `/purchase-orders/{id}` | Update PO |
| DELETE | `/purchase-orders/{id}` | Delete draft PO |
| POST | `/purchase-orders/{id}/send` | Mark as sent |
| POST | `/purchase-orders/{id}/convert-to-bill` | Convert PO → Bill |

### Purchase Bills

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/purchase-bills` | List with filters |
| POST | `/purchase-bills` | Create bill (updates stock + ledger) |
| GET | `/purchase-bills/{id}` | Get bill detail |
| PUT | `/purchase-bills/{id}` | Update draft bill |
| DELETE | `/purchase-bills/{id}` | Delete draft bill |
| POST | `/purchase-bills/{id}/returns` | Create purchase return (debit note) |

---

## 9.9 Sales Endpoints

### Quotations: `/quotations/*`
### Sales Orders: `/sales-orders/*`
### Invoices (see §9.10)
### Credit Notes: `/credit-notes/*`
### Debit Notes: `/debit-notes/*`

---

## 9.10 Invoice Endpoints

### GET `/invoices`

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | DRAFT, CONFIRMED, SENT, PARTIALLY_PAID, PAID, OVERDUE, VOID |
| `customerId` | UUID | Filter by customer |
| `fromDate` | date | Invoice date from |
| `toDate` | date | Invoice date to |
| `minAmount` | decimal | Total ≥ |
| `maxAmount` | decimal | Total ≤ |
| `search` | string | Invoice number, customer name |

### POST `/invoices`

**Request:**
```json
{
  "customerId": "cust-uuid-1",
  "invoiceDate": "2026-07-10",
  "dueDate": "2026-08-09",
  "placeOfSupply": "27",
  "templateName": "classic",
  "items": [
    {
      "productId": "prod-uuid-1",
      "quantity": 10,
      "unitPrice": 5000.00,
      "discountPercent": 5,
      "gstRate": 18,
      "warehouseId": "wh-uuid-1"
    },
    {
      "productId": "prod-uuid-2",
      "quantity": 5,
      "unitPrice": 2000.00,
      "discountPercent": 0,
      "gstRate": 12,
      "warehouseId": "wh-uuid-1"
    }
  ],
  "additionalCharges": 500,
  "notes": "Thank you for your business",
  "terms": "Payment within 30 days",
  "internalNotes": "Urgent order"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "inv-uuid-1",
    "invoiceNumber": "INV/MUM/2627/00001",
    "customerId": "cust-uuid-1",
    "customerName": "Priya Electronics",
    "invoiceDate": "2026-07-10",
    "dueDate": "2026-08-09",
    "supplyType": "INTRA_STATE",
    "status": "CONFIRMED",
    "items": [
      {
        "productName": "Laptop Stand",
        "hsnCode": "73269099",
        "quantity": 10,
        "unitPrice": 5000.00,
        "discountPercent": 5,
        "discountAmount": 2500.00,
        "taxableAmount": 47500.00,
        "gstRate": 18,
        "cgstAmount": 4275.00,
        "sgstAmount": 4275.00,
        "igstAmount": 0,
        "totalAmount": 56050.00
      }
    ],
    "subtotal": 57500.00,
    "discountAmount": 2500.00,
    "taxAmount": 10260.00,
    "cgstTotal": 5130.00,
    "sgstTotal": 5130.00,
    "igstTotal": 0,
    "additionalCharges": 500.00,
    "roundOff": -0.40,
    "totalAmount": 65760.00,
    "amountInWords": "Sixty-Five Thousand Seven Hundred and Sixty Rupees Only",
    "paidAmount": 0,
    "dueAmount": 65760.00,
    "pdfUrl": "https://storage.billos.app/invoices/org-uuid/inv-uuid-1.pdf"
  }
}
```

### GET `/invoices/{id}`
### PUT `/invoices/{id}` — Only DRAFT status
### DELETE `/invoices/{id}` — Only DRAFT status

### POST `/invoices/{id}/send`

Send invoice via email.

**Request:**
```json
{
  "to": ["priya@electronics.com"],
  "cc": ["accounts@electronics.com"],
  "subject": "Invoice INV/MUM/2627/00001 from Rakesh Store",
  "message": "Please find attached invoice for your recent purchase."
}
```

### POST `/invoices/{id}/void`

Void an invoice (creates credit note automatically).

**Request:** `{ "reason": "Duplicate invoice created" }`

### GET `/invoices/{id}/pdf` — Download PDF
### POST `/invoices/{id}/duplicate` — Clone invoice
### POST `/invoices/{id}/generate-einvoice` — Push to IRP

---

## 9.11 Payment Endpoints

### GET `/payments`
### POST `/payments`

**Request:**
```json
{
  "paymentType": "RECEIVED",
  "referenceType": "INVOICE",
  "referenceId": "inv-uuid-1",
  "customerId": "cust-uuid-1",
  "amount": 30000.00,
  "paymentMode": "UPI",
  "paymentDate": "2026-07-15",
  "transactionRef": "UPI-REF-123456",
  "notes": "Partial payment"
}
```

### GET `/payments/{id}`
### DELETE `/payments/{id}`
### GET `/payments/{id}/receipt` — Download payment receipt PDF

---

## 9.12 Dashboard Endpoints

### GET `/dashboard/summary`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "revenue": { "currentMonth": 450000, "previousMonth": 380000, "trend": "UP" },
    "expenses": { "currentMonth": 320000, "previousMonth": 290000, "trend": "UP" },
    "profit": { "currentMonth": 130000, "previousMonth": 90000, "trend": "UP" },
    "pendingReceivables": 285000,
    "pendingPayables": 142000,
    "lowStockCount": 7,
    "recentTransactions": [ ... ],
    "topCustomers": [ ... ],
    "topProducts": [ ... ]
  }
}
```

### GET `/dashboard/sales-trend?period=12M` — Monthly sales graph data
### GET `/dashboard/cash-flow?period=6M` — Cash flow over time
### GET `/dashboard/aging-receivables` — Aging breakdown

---

## 9.13 Report Endpoints

### GET `/reports/sales-register?from=2026-04-01&to=2026-07-10&format=json`
### GET `/reports/purchase-register?from=...&to=...`
### GET `/reports/stock-summary`
### GET `/reports/stock-movement?productId=...&from=...&to=...`
### GET `/reports/gstr-1?period=072026` — GSTR-1 formatted data
### GET `/reports/gstr-3b?period=072026` — GSTR-3B summary
### GET `/reports/hsn-summary?from=...&to=...`
### GET `/reports/outstanding-receivables?asOfDate=2026-07-10`
### GET `/reports/outstanding-payables?asOfDate=2026-07-10`
### GET `/reports/profit-loss?from=...&to=...`
### GET `/reports/export?type=sales-register&format=xlsx&from=...&to=...` — Export any report

---

## 9.14 Settings Endpoints

### GET `/settings` — All settings for current org
### PUT `/settings/{category}/{key}` — Update specific setting
### GET `/settings/invoice-templates` — List available invoice templates

---

## 9.15 User Management Endpoints

### GET `/users` — List org users (Admin+)
### POST `/users/invite` — Invite user to org
### PUT `/users/{id}/role` — Change user role
### DELETE `/users/{id}` — Remove user from org (not delete account)
### GET `/users/sessions` — List current user's active sessions
### DELETE `/users/sessions/{sessionId}` — Revoke specific session

---

## 9.16 Audit Log Endpoints

### GET `/audit-logs`

| Param | Type | Description |
|-------|------|-------------|
| `userId` | UUID | Filter by user |
| `entityType` | string | INVOICE, CUSTOMER, PRODUCT, etc. |
| `entityId` | UUID | Specific entity |
| `action` | string | CREATE, UPDATE, DELETE, etc. |
| `from` | datetime | Start timestamp |
| `to` | datetime | End timestamp |

---

## 9.17 AI Endpoints (Phase 3)

### POST `/ai/chat`

**Request:**
```json
{
  "sessionId": "session-uuid",
  "message": "What were my top 5 customers this month?"
}
```

**Response:** Server-Sent Events (SSE) stream.

### POST `/ai/ocr/invoice` — Multipart upload → extracted invoice data
### POST `/ai/ocr/receipt` — Multipart upload → extracted receipt data
### POST `/ai/search` — Natural language search
### GET `/ai/insights` — Auto-generated insights
### GET `/ai/forecast/sales` — Sales forecast
### GET `/ai/forecast/inventory` — Inventory demand forecast
### GET `/ai/health-score` — Business health score

---

> **Next:** [Chapter 10 — UI/UX Design System](./10-ui-ux-design-system.md)
