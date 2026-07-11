# Chapter 6 — System Architecture

> Back to [Index](./README.md) | Prev ← [Tech Stack](./05-tech-stack.md) | Next → [Folder Structure](./07-folder-structure.md)

---

## 6.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐    │
│  │  Browser  │  │  PWA      │  │  Mobile   │  │  Third-party (API)  │    │
│  │  (Next.js)│  │  (Next.js)│  │  (Future) │  │  (OpenAPI clients)  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────────┘    │
│       │              │              │                  │                  │
└───────┼──────────────┼──────────────┼──────────────────┼─────────────────┘
        │              │              │                  │
        ▼              ▼              ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EDGE / CDN LAYER                                │
│                        Cloudflare (WAF + CDN)                          │
│  • DDoS protection  • SSL termination  • Caching  • Rate limiting      │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                                  ▼
┌──────────────────────┐            ┌──────────────────────────────────┐
│   FRONTEND HOST      │            │        BACKEND HOST              │
│   Vercel             │            │   ┌──────────────────────────┐   │
│                      │            │   │      Nginx               │   │
│   Next.js App        │            │   │  (Reverse Proxy + SSL)   │   │
│   • SSR/SSG          │            │   └────────────┬─────────────┘   │
│   • Static assets    │            │                │                 │
│   • API routes       │───────────▶│   ┌────────────▼─────────────┐   │
│     (BFF proxy)      │            │   │   Spring Boot 3.3        │   │
│                      │            │   │                          │   │
└──────────────────────┘            │   │   • REST API (/api/v1/)  │   │
                                    │   │   • Spring Security      │   │
                                    │   │   • Business Logic       │   │
                                    │   │   • JPA + Hibernate      │   │
                                    │   │   • Actuator (health)    │   │
                                    │   └──────┬──────────┬────────┘   │
                                    │          │          │            │
                                    │   ┌──────▼───┐  ┌──▼──────────┐ │
                                    │   │ AI Svc   │  │  Background │ │
                                    │   │ (FastAPI) │  │  Jobs       │ │
                                    │   └──────┬───┘  └─────────────┘ │
                                    └──────────┼──────────────────────┘
                                               │
              ┌─────────────────┬──────────────┼─────────────┐
              ▼                 ▼              ▼             ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────┐
│ Supabase         │ │ Supabase     │ │ Redis        │ │ LLM     │
│ PostgreSQL       │ │ Storage      │ │              │ │ APIs    │
│ • Business data  │ │ • PDFs       │ │ • Cache      │ │ • Claude│
│ • pgvector       │ │ • Images     │ │ • Sessions   │ │ • OpenAI│
│ • Audit logs     │ │ • Documents  │ │ • Rate limits│ │ • Gemini│
└──────────────────┘ └──────────────┘ └──────────────┘ └─────────┘
```

---

## 6.2 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE                                    │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ DNS        │  │ WAF      │  │ DDoS     │  │ Edge Cache   │  │
│  │ Management │  │ Rules    │  │ Shield   │  │ (Static)     │  │
│  └─────┬──────┘  └──────────┘  └──────────┘  └──────────────┘  │
└────────┼────────────────────────────────────────────────────────┘
         │
         ├──── billos.app ────────────────▶ Vercel (Next.js)
         │                                     │
         └──── api.billos.app ───────────▶ Railway/Render
                                               │
                                    ┌──────────┼──────────┐
                                    ▼          ▼          ▼
                              ┌──────────┐ ┌──────┐ ┌──────────┐
                              │Spring    │ │AI    │ │Redis     │
                              │Boot     │ │Svc   │ │Container │
                              │Container│ │Cont. │ │          │
                              └────┬─────┘ └──┬───┘ └──────────┘
                                   │          │
                                   ▼          ▼
                              ┌─────────────────────┐
                              │  Supabase Cloud     │
                              │  (ap-south-1 Mumbai)│
                              │  • PostgreSQL       │
                              │  • Storage          │
                              │  • Auth (optional)  │
                              └─────────────────────┘
```

### Environment Strategy

| Environment | Frontend | Backend | Database | Purpose |
|------------|----------|---------|----------|---------|
| **Local Dev** | `localhost:3000` | `localhost:8080` | Docker PostgreSQL | Developer workstation |
| **CI** | — | — | TestContainers | Automated test runs |
| **Staging** | `staging.billos.app` | `staging-api.billos.app` | Supabase (staging project) | Pre-production testing |
| **Production** | `billos.app` | `api.billos.app` | Supabase (production project) | Live users |

---

## 6.3 Sequence Diagrams

### 6.3.1 Login Flow

```
┌──────┐          ┌──────────┐          ┌──────────────┐       ┌──────┐
│Client│          │ Next.js  │          │ Spring Boot  │       │ DB   │
└──┬───┘          └────┬─────┘          └──────┬───────┘       └──┬───┘
   │  POST /login      │                       │                  │
   │──────────────────▶│                       │                  │
   │                   │  POST /api/v1/auth/login                 │
   │                   │──────────────────────▶│                  │
   │                   │                       │  SELECT user     │
   │                   │                       │─────────────────▶│
   │                   │                       │  user record     │
   │                   │                       │◀─────────────────│
   │                   │                       │                  │
   │                   │                       │  Verify BCrypt   │
   │                   │                       │  password        │
   │                   │                       │                  │
   │                   │                       │  Generate JWT    │
   │                   │                       │  (access + refresh)
   │                   │                       │                  │
   │                   │                       │  Store refresh   │
   │                   │                       │  token in DB     │
   │                   │                       │─────────────────▶│
   │                   │                       │                  │
   │                   │                       │  Log login event │
   │                   │                       │─────────────────▶│
   │                   │                       │                  │
   │                   │  200: { accessToken,  │                  │
   │                   │   user, orgs }        │                  │
   │                   │  Set-Cookie: refresh  │                  │
   │                   │◀──────────────────────│                  │
   │  200 + httpOnly   │                       │                  │
   │  cookie           │                       │                  │
   │◀──────────────────│                       │                  │
   │                   │                       │                  │
   │  Store accessToken│                       │                  │
   │  in memory        │                       │                  │
   │  Redirect to      │                       │                  │
   │  dashboard        │                       │                  │
```

### 6.3.2 Create Invoice Flow

```
┌──────┐       ┌──────────┐       ┌──────────────┐    ┌──────┐   ┌─────────┐
│Client│       │ Next.js  │       │ Spring Boot  │    │  DB  │   │Supabase │
│      │       │          │       │              │    │      │   │Storage  │
└──┬───┘       └────┬─────┘       └──────┬───────┘    └──┬───┘   └────┬────┘
   │                │                     │               │            │
   │ Fill invoice   │                     │               │            │
   │ form           │                     │               │            │
   │                │                     │               │            │
   │ POST /invoice  │                     │               │            │
   │───────────────▶│                     │               │            │
   │                │ POST /api/v1/invoices│              │            │
   │                │────────────────────▶│               │            │
   │                │                     │               │            │
   │                │                     │ Validate JWT  │            │
   │                │                     │ + permissions │            │
   │                │                     │               │            │
   │                │                     │ Validate DTO  │            │
   │                │                     │ (Zod/Bean)    │            │
   │                │                     │               │            │
   │                │                     │ Check credit  │            │
   │                │                     │ limit         │            │
   │                │                     │──────────────▶│            │
   │                │                     │◀──────────────│            │
   │                │                     │               │            │
   │                │                     │ Calculate tax │            │
   │                │                     │ (CGST/SGST/   │            │
   │                │                     │  IGST)        │            │
   │                │                     │               │            │
   │                │                     │ Generate      │            │
   │                │                     │ invoice #     │            │
   │                │                     │──────────────▶│            │
   │                │                     │◀──────────────│            │
   │                │                     │               │            │
   │                │                     │ BEGIN TX       │            │
   │                │                     │ Save invoice  │            │
   │                │                     │ + line items   │            │
   │                │                     │ Update stock   │            │
   │                │                     │ Update ledger  │            │
   │                │                     │ Audit log      │            │
   │                │                     │──────────────▶│            │
   │                │                     │ COMMIT         │            │
   │                │                     │◀──────────────│            │
   │                │                     │               │            │
   │                │                     │ Generate PDF  │            │
   │                │                     │               │            │
   │                │                     │ Upload PDF    │            │
   │                │                     │───────────────┼───────────▶│
   │                │                     │◀──────────────┼────────────│
   │                │                     │               │            │
   │                │ 201: invoice data   │               │            │
   │                │◀────────────────────│               │            │
   │ Invoice created│                     │               │            │
   │◀───────────────│                     │               │            │
```

### 6.3.3 Generate PDF Flow

```
┌──────────────┐       ┌──────┐       ┌─────────┐
│ Spring Boot  │       │  DB  │       │Supabase │
│              │       │      │       │Storage  │
└──────┬───────┘       └──┬───┘       └────┬────┘
       │                  │                │
       │ Fetch invoice    │                │
       │ + org settings   │                │
       │─────────────────▶│                │
       │◀─────────────────│                │
       │                  │                │
       │ Load template    │                │
       │ (Classic/Modern) │                │
       │                  │                │
       │ Fetch org logo   │                │
       │─────────────────────────────────▶│
       │◀─────────────────────────────────│
       │                  │                │
       │ Build PDF:       │                │
       │ • Header (logo,  │                │
       │   company info)  │                │
       │ • Customer info  │                │
       │ • Line items     │                │
       │ • Tax summary    │                │
       │ • HSN summary    │                │
       │ • Bank details   │                │
       │ • QR code (if    │                │
       │   e-invoice)     │                │
       │ • Amount in words│                │
       │ • Terms          │                │
       │                  │                │
       │ Upload PDF       │                │
       │─────────────────────────────────▶│
       │  PDF URL         │                │
       │◀─────────────────────────────────│
       │                  │                │
       │ Update invoice   │                │
       │ with PDF URL     │                │
       │─────────────────▶│                │
       │◀─────────────────│                │
```

### 6.3.4 AI Chat Flow

```
┌──────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐    ┌──────┐  ┌─────┐
│Client│    │ Next.js  │    │ Spring Boot  │    │ AI Svc   │    │  DB  │  │ LLM │
└──┬───┘    └────┬─────┘    └──────┬───────┘    └────┬─────┘    └──┬───┘  └──┬──┘
   │             │                 │                  │             │         │
   │ "What were  │                 │                  │             │         │
   │  my top 5   │                 │                  │             │         │
   │  customers  │                 │                  │             │         │
   │  this month"│                 │                  │             │         │
   │────────────▶│                 │                  │             │         │
   │             │ POST /api/v1/ai/chat               │             │         │
   │             │────────────────▶│                  │             │         │
   │             │                 │ Validate JWT +   │             │         │
   │             │                 │ extract org_id   │             │         │
   │             │                 │                  │             │         │
   │             │                 │ POST /ai/chat    │             │         │
   │             │                 │─────────────────▶│             │         │
   │             │                 │                  │             │         │
   │             │                 │                  │ Classify    │         │
   │             │                 │                  │ intent      │         │
   │             │                 │                  │────────────────────▶│
   │             │                 │                  │  "DATA_QUERY"       │
   │             │                 │                  │◀────────────────────│
   │             │                 │                  │             │         │
   │             │                 │                  │ Generate SQL│         │
   │             │                 │                  │────────────────────▶│
   │             │                 │                  │  SQL query  │         │
   │             │                 │                  │◀────────────────────│
   │             │                 │                  │             │         │
   │             │                 │                  │ Execute SQL │         │
   │             │                 │                  │ (org-scoped)│         │
   │             │                 │                  │────────────▶│         │
   │             │                 │                  │  results    │         │
   │             │                 │                  │◀────────────│         │
   │             │                 │                  │             │         │
   │             │                 │                  │ Format      │         │
   │             │                 │                  │ response    │         │
   │             │                 │                  │────────────────────▶│
   │             │                 │                  │  NL answer  │         │
   │             │                 │                  │◀────────────────────│
   │             │                 │                  │             │         │
   │             │                 │  SSE stream      │             │         │
   │             │                 │◀─────────────────│             │         │
   │             │  SSE stream     │                  │             │         │
   │             │◀────────────────│                  │             │         │
   │  Streaming  │                 │                  │             │         │
   │  response   │                 │                  │             │         │
   │◀────────────│                 │                  │             │         │
```

### 6.3.5 OCR Upload Flow

```
┌──────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐    ┌─────┐  ┌─────────┐
│Client│    │ Next.js  │    │ Spring Boot  │    │ AI Svc   │    │ LLM │  │Supabase │
└──┬───┘    └────┬─────┘    └──────┬───────┘    └────┬─────┘    └──┬──┘  └────┬────┘
   │             │                 │                  │             │          │
   │ Upload      │                 │                  │             │          │
   │ invoice img │                 │                  │             │          │
   │────────────▶│                 │                  │             │          │
   │             │ POST /api/v1/ai/ocr/invoice        │             │          │
   │             │ (multipart)     │                  │             │          │
   │             │────────────────▶│                  │             │          │
   │             │                 │                  │             │          │
   │             │                 │ Store temp file  │             │          │
   │             │                 │────────────────────────────────────────▶│
   │             │                 │                  │             │          │
   │             │                 │ POST /ai/ocr     │             │          │
   │             │                 │─────────────────▶│             │          │
   │             │                 │                  │             │          │
   │             │                 │                  │ Preprocess  │          │
   │             │                 │                  │ image       │          │
   │             │                 │                  │             │          │
   │             │                 │                  │ Claude      │          │
   │             │                 │                  │ Vision API  │          │
   │             │                 │                  │────────────▶│          │
   │             │                 │                  │ structured  │          │
   │             │                 │                  │ data        │          │
   │             │                 │                  │◀────────────│          │
   │             │                 │                  │             │          │
   │             │                 │                  │ Validate    │          │
   │             │                 │                  │ GSTIN, HSN  │          │
   │             │                 │                  │ amounts     │          │
   │             │                 │                  │             │          │
   │             │                 │  Extracted data  │             │          │
   │             │                 │◀─────────────────│             │          │
   │             │                 │                  │             │          │
   │             │  Review screen  │                  │             │          │
   │             │  (pre-filled)   │                  │             │          │
   │             │◀────────────────│                  │             │          │
   │ Show review │                 │                  │             │          │
   │ form        │                 │                  │             │          │
   │◀────────────│                 │                  │             │          │
   │             │                 │                  │             │          │
   │ User        │                 │                  │             │          │
   │ confirms    │                 │                  │             │          │
   │────────────▶│                 │                  │             │          │
   │             │ POST /api/v1/purchases             │             │          │
   │             │────────────────▶│                  │             │          │
   │             │                 │ Create purchase  │             │          │
   │             │                 │ (standard flow)  │             │          │
```

### 6.3.6 Payment Recording Flow

```
┌──────┐       ┌──────────────┐       ┌──────┐
│Client│       │ Spring Boot  │       │  DB  │
└──┬───┘       └──────┬───────┘       └──┬───┘
   │                  │                  │
   │ POST /api/v1/    │                  │
   │ payments         │                  │
   │ { invoiceId,     │                  │
   │   amount,        │                  │
   │   mode, date }   │                  │
   │─────────────────▶│                  │
   │                  │                  │
   │                  │ Validate JWT     │
   │                  │ + permissions    │
   │                  │                  │
   │                  │ Fetch invoice    │
   │                  │─────────────────▶│
   │                  │◀─────────────────│
   │                  │                  │
   │                  │ Validate:        │
   │                  │ • amount ≤ due   │
   │                  │ • invoice exists │
   │                  │ • same org       │
   │                  │                  │
   │                  │ BEGIN TX         │
   │                  │ Create payment   │
   │                  │ Update invoice   │
   │                  │   paid_amount    │
   │                  │   status (PAID/  │
   │                  │   PARTIAL)       │
   │                  │ Update customer  │
   │                  │   outstanding    │
   │                  │ Audit log        │
   │                  │─────────────────▶│
   │                  │ COMMIT           │
   │                  │◀─────────────────│
   │                  │                  │
   │ 201: payment     │                  │
   │◀─────────────────│                  │
```

---

## 6.4 Database Architecture

### ER Diagram (Core Entities)

```
┌──────────────────┐       ┌──────────────────┐
│   organizations  │       │     users        │
│──────────────────│       │──────────────────│
│ id (PK)          │       │ id (PK)          │
│ name             │◀──┐   │ email            │
│ legal_name       │   │   │ password_hash    │
│ business_type    │   │   │ full_name        │
│ gstin            │   │   │ status           │
│ state_code       │   │   └──────────────────┘
│ ...              │   │            │
└──────────────────┘   │            │ M:N
         │             │   ┌────────▼─────────┐
         │ 1:N         │   │ user_org_roles   │
         │             └───│──────────────────│
         │                 │ user_id (FK)     │
         │                 │ org_id (FK)      │
         │                 │ role             │
         ▼                 └──────────────────┘
┌──────────────────┐
│   customers      │       ┌──────────────────┐
│──────────────────│       │   suppliers      │
│ id (PK)          │       │──────────────────│
│ organization_id  │       │ id (PK)          │
│ display_name     │       │ organization_id  │
│ gstin            │       │ display_name     │
│ credit_limit     │       │ gstin            │
│ outstanding      │       │ outstanding      │
│ ...              │       │ ...              │
└────────┬─────────┘       └────────┬─────────┘
         │                          │
         │ 1:N                      │ 1:N
         ▼                          ▼
┌──────────────────┐       ┌──────────────────┐
│ sales_invoices   │       │ purchase_bills   │
│──────────────────│       │──────────────────│
│ id (PK)          │       │ id (PK)          │
│ organization_id  │       │ organization_id  │
│ customer_id (FK) │       │ supplier_id (FK) │
│ invoice_number   │       │ bill_number      │
│ invoice_date     │       │ bill_date        │
│ subtotal         │       │ subtotal         │
│ tax_amount       │       │ tax_amount       │
│ total_amount     │       │ total_amount     │
│ paid_amount      │       │ paid_amount      │
│ status           │       │ status           │
│ ...              │       │ ...              │
└────────┬─────────┘       └────────┬─────────┘
         │                          │
         │ 1:N                      │ 1:N
         ▼                          ▼
┌──────────────────┐       ┌──────────────────┐
│ invoice_items    │       │ bill_items       │
│──────────────────│       │──────────────────│
│ id (PK)          │       │ id (PK)          │
│ invoice_id (FK)  │       │ bill_id (FK)     │
│ product_id (FK)  │       │ product_id (FK)  │
│ quantity         │       │ quantity         │
│ rate             │       │ rate             │
│ discount         │       │ discount         │
│ tax_rate         │       │ tax_rate         │
│ cgst / sgst/igst │       │ cgst / sgst/igst │
│ amount           │       │ amount           │
└──────────────────┘       └──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│   products       │       │   inventory      │
│──────────────────│       │──────────────────│
│ id (PK)          │       │ id (PK)          │
│ organization_id  │       │ organization_id  │
│ name             │       │ product_id (FK)  │
│ hsn_code         │       │ warehouse_id(FK) │
│ gst_rate         │       │ quantity         │
│ purchase_price   │       │ reserved_qty     │
│ selling_price    │       │ reorder_level    │
│ track_inventory  │       │ valuation_amount │
│ ...              │       │ ...              │
└──────────────────┘       └──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│   payments       │       │   audit_logs     │
│──────────────────│       │──────────────────│
│ id (PK)          │       │ id (PK)          │
│ organization_id  │       │ organization_id  │
│ payment_type     │       │ user_id          │
│ reference_type   │       │ action           │
│ reference_id     │       │ entity_type      │
│ amount           │       │ entity_id        │
│ payment_mode     │       │ changes (JSONB)  │
│ payment_date     │       │ ip_address       │
│ ...              │       │ created_at       │
└──────────────────┘       └──────────────────┘
```

### Indexing Strategy

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| All business tables | `organization_id` | B-tree | Tenant isolation (every query) |
| `users` | `email` | Unique | Login lookup |
| `customers` | `(organization_id, gstin)` | Unique | GSTIN uniqueness per org |
| `customers` | `(organization_id, display_name)` | B-tree | Name search |
| `suppliers` | `(organization_id, gstin)` | Unique | GSTIN uniqueness per org |
| `products` | `(organization_id, product_code)` | Unique | SKU uniqueness per org |
| `products` | `(organization_id, name)` | GIN (trigram) | Fuzzy search |
| `sales_invoices` | `(organization_id, invoice_number)` | Unique | Invoice number uniqueness |
| `sales_invoices` | `(organization_id, invoice_date)` | B-tree | Date range queries |
| `sales_invoices` | `(organization_id, customer_id)` | B-tree | Customer invoice lookup |
| `sales_invoices` | `(organization_id, status)` | B-tree | Status filtering |
| `purchase_bills` | `(organization_id, bill_number)` | Unique | Bill number uniqueness |
| `payments` | `(organization_id, payment_date)` | B-tree | Date range queries |
| `payments` | `(reference_type, reference_id)` | B-tree | Payment lookup by invoice |
| `audit_logs` | `(organization_id, created_at)` | B-tree (DESC) | Recent audit log queries |
| `audit_logs` | `(organization_id, entity_type, entity_id)` | B-tree | Entity audit trail |
| `inventory` | `(organization_id, product_id, warehouse_id)` | Unique | Stock uniqueness |

### Constraints

| Constraint | Table | Type | Rule |
|-----------|-------|------|------|
| Positive amounts | invoices, payments | CHECK | `amount >= 0` |
| Valid status | invoices | CHECK | `status IN ('DRAFT','CONFIRMED',...)` |
| Valid GST rate | products | CHECK | `gst_rate IN (0,0.25,3,5,12,18,28)` |
| Non-negative stock | inventory | CHECK | `quantity >= 0` |
| Invoice number seq | sales_invoices | UNIQUE | `(organization_id, invoice_number)` |
| Soft delete | All business tables | Column | `deleted_at TIMESTAMP NULL` |
| Optimistic lock | All mutable tables | Column | `version INTEGER DEFAULT 0` |

---

## 6.5 API Architecture

### Base URL Structure

```
Production:  https://api.billos.app/api/v1/
Staging:     https://staging-api.billos.app/api/v1/
Local:       http://localhost:8080/api/v1/
```

### Versioning Strategy

- URL-based versioning: `/api/v1/`, `/api/v2/`
- Major version bump only for breaking changes
- Minor/patch changes are backward-compatible
- Deprecation notice: 6 months before removing old version

### Naming Conventions

| Convention | Example |
|-----------|---------|
| Plural nouns for resources | `/api/v1/customers`, `/api/v1/invoices` |
| Kebab-case for multi-word | `/api/v1/purchase-orders` |
| Nested resources for relationships | `/api/v1/customers/{id}/invoices` |
| Action verbs for non-CRUD | `/api/v1/invoices/{id}/send`, `/api/v1/invoices/{id}/void` |
| Query params for filtering | `?status=PAID&from=2026-01-01&to=2026-06-30` |

### Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Invoice created successfully",
  "timestamp": "2026-07-10T18:00:00Z"
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "size": 20,
    "totalElements": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  },
  "timestamp": "2026-07-10T18:00:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "INVOICE_NOT_FOUND",
    "message": "Invoice with ID abc-123 not found",
    "details": [],
    "path": "/api/v1/invoices/abc-123",
    "timestamp": "2026-07-10T18:00:00Z",
    "traceId": "req-uuid-here"
  }
}
```

**Validation Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address",
        "rejectedValue": "not-an-email"
      },
      {
        "field": "amount",
        "message": "Must be greater than 0",
        "rejectedValue": -100
      }
    ],
    "path": "/api/v1/customers",
    "timestamp": "2026-07-10T18:00:00Z",
    "traceId": "req-uuid-here"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| `200` | OK | Successful GET, PUT, PATCH |
| `201` | Created | Successful POST (resource created) |
| `204` | No Content | Successful DELETE |
| `400` | Bad Request | Validation errors, malformed request |
| `401` | Unauthorized | Missing or invalid JWT |
| `403` | Forbidden | Valid JWT but insufficient permissions |
| `404` | Not Found | Resource doesn't exist (in this org) |
| `409` | Conflict | Duplicate resource (e.g., duplicate invoice number) |
| `422` | Unprocessable Entity | Business rule violation |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server error |
| `503` | Service Unavailable | Maintenance or overload |

### Pagination

```
GET /api/v1/invoices?page=0&size=20&sort=invoiceDate,desc

Defaults:
  page = 0 (zero-indexed)
  size = 20 (max 100)
  sort = createdAt,desc
```

### Filtering

```
GET /api/v1/invoices?status=PAID&customerId=uuid&fromDate=2026-01-01&toDate=2026-06-30&minAmount=1000&maxAmount=50000&search=laptop
```

### Sorting

```
GET /api/v1/invoices?sort=invoiceDate,desc&sort=totalAmount,asc
```

Multiple sort fields supported, comma-separated direction.

---

## 6.6 Authentication Architecture

### JWT Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Authentication Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. LOGIN                                                       │
│  ┌──────┐     credentials     ┌──────────┐   access + refresh  │
│  │Client│────────────────────▶│  /login   │──────────────────▶  │
│  └──────┘                     └──────────┘                      │
│                                                                 │
│  2. AUTHENTICATED REQUEST                                       │
│  ┌──────┐  Authorization:     ┌──────────┐   validate JWT      │
│  │Client│  Bearer <token>    ▶│  /api/*   │──▶ SecurityFilter  │
│  └──────┘                     └──────────┘   ──▶ proceed       │
│                                                                 │
│  3. TOKEN REFRESH (silent, 1 min before expiry)                 │
│  ┌──────┐  Cookie: refresh    ┌──────────┐   new access token  │
│  │Client│────────────────────▶│ /refresh  │──────────────────▶  │
│  └──────┘                     └──────────┘   + rotate refresh  │
│                                                                 │
│  4. TOKEN REUSE DETECTION                                       │
│  ┌──────┐  old refresh token  ┌──────────┐   ALERT! Revoke     │
│  │Attack│────────────────────▶│ /refresh  │──▶ entire family   │
│  └──────┘                     └──────────┘   ──▶ force logout  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### RBAC Architecture

```
┌──────────────────────────────────────────────────────┐
│                   RBAC Model                         │
├──────────────────────────────────────────────────────┤
│                                                      │
│  User ──M:N──▶ Organization (via user_org_roles)     │
│                     │                                │
│                     │ role = OWNER|ADMIN|MANAGER|    │
│                     │         ACCOUNTANT|STAFF       │
│                     │                                │
│                     ▼                                │
│  Role ──1:N──▶ Permissions                           │
│                                                      │
│  Permission Format: {ENTITY}_{ACTION}                │
│                                                      │
│  Examples:                                           │
│  • INVOICE_CREATE                                    │
│  • INVOICE_READ                                      │
│  • INVOICE_UPDATE                                    │
│  • INVOICE_DELETE                                    │
│  • INVOICE_SEND                                      │
│  • CUSTOMER_CREATE                                   │
│  • REPORT_VIEW_FINANCIAL                             │
│  • SETTINGS_EDIT                                     │
│  • AUDIT_LOG_VIEW                                    │
│                                                      │
│  Enforcement Points:                                 │
│  1. API Gateway (Spring Security filter)             │
│  2. Method-level (@PreAuthorize)                     │
│  3. Service-level (custom checks)                    │
│  4. UI-level (hide/disable elements)                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 6.7 AI Architecture

### RAG Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    RAG Pipeline                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INDEXING (Background / On-demand)                          │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐│
│  │ Document │───▶│ Chunker  │───▶│ Embedder │───▶│pgvector││
│  │ Loader   │    │ (512tok, │    │(OpenAI   │    │ Store  ││
│  │(invoice, │    │ 50 over- │    │ text-emb-│    │        ││
│  │ product, │    │ lap)     │    │ 3-small) │    │        ││
│  │ customer)│    └──────────┘    └──────────┘    └────────┘│
│  └──────────┘                                              │
│                                                             │
│  RETRIEVAL (Per query)                                      │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐│
│  │ User     │───▶│ Query    │───▶│ Vector   │───▶│ Re-    ││
│  │ Query    │    │ Embedder │    │ Search   │    │ ranker ││
│  │          │    │          │    │ (top-k=10│    │(top-5) ││
│  └──────────┘    └──────────┘    │ + MMR)   │    └───┬────┘│
│                                  └──────────┘        │     │
│                                                      ▼     │
│  GENERATION                                                │
│                                                             │
│  ┌───────────────────────────────────────────────────┐      │
│  │ System Prompt + Retrieved Context + User Query    │      │
│  │                      │                            │      │
│  │                      ▼                            │      │
│  │               Claude API                          │      │
│  │                      │                            │      │
│  │                      ▼                            │      │
│  │            Cited, Grounded Response               │      │
│  └───────────────────────────────────────────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Embedding Pipeline

| Aspect | Detail |
|--------|--------|
| **Model** | `text-embedding-3-small` (1536 dimensions) |
| **Chunking** | Semantic chunking, 512 tokens, 50-token overlap |
| **Index** | IVFFlat (pgvector) with 100 lists for < 1M vectors; switch to HNSW at scale |
| **Distance** | Cosine similarity |
| **Metadata** | `organization_id`, `entity_type`, `entity_id`, `chunk_index` |
| **Refresh** | Re-embed on entity update; batch re-index nightly |

### Prompt Template Structure

```
/ai-service/prompts/
├── system/
│   ├── copilot_v1.txt          # Main copilot system prompt
│   ├── sql_generator_v1.txt    # SQL generation prompt
│   ├── ocr_invoice_v1.txt      # Invoice OCR extraction
│   └── ocr_receipt_v1.txt      # Receipt OCR extraction
├── tools/
│   ├── search_customers.txt    # Tool description for customer search
│   ├── query_sales.txt         # Tool description for sales queries
│   └── create_invoice.txt      # Tool description for invoice creation
└── templates/
    ├── insight_weekly.txt       # Weekly insight generation
    ├── health_score.txt         # Business health analysis
    └── forecast.txt             # Sales/inventory forecasting
```

### Conversation Memory Architecture

```
┌─────────────────────────────────────────────────────┐
│              Memory Layers                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Layer 1: Buffer Memory (in-process)                │
│  ├── Last N messages (configurable, default 20)     │
│  ├── Sliding window to manage context tokens        │
│  └── Eviction: oldest messages first                │
│                                                     │
│  Layer 2: Session Memory (PostgreSQL)               │
│  ├── Full conversation history per session          │
│  ├── Sessions scoped to (user_id, org_id)           │
│  ├── Retention: 90 days                             │
│  └── Searchable for conversation continuity         │
│                                                     │
│  Layer 3: Semantic Memory (pgvector)                │
│  ├── Embedded business data (products, customers)   │
│  ├── Uploaded documents (contracts, policies)        │
│  ├── Historical insights and summaries              │
│  └── Organization-scoped retrieval                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 6.8 Multi-Tenant Architecture

### Isolation Strategy

```
┌─────────────────────────────────────────────────────────────┐
│              Multi-Tenant Isolation Layers                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: JWT Token                                         │
│  ├── org_id claim in JWT payload                            │
│  ├── Validated on every request by SecurityFilter           │
│  └── Cannot be forged (RS256 signed)                        │
│                                                             │
│  Layer 2: TenantContext (ThreadLocal)                        │
│  ├── Set by TenantFilter from JWT org_id                    │
│  ├── Available throughout request lifecycle                 │
│  ├── Cleared in finally block                               │
│  └── Used by all service/repository layers                  │
│                                                             │
│  Layer 3: Hibernate @Filter                                 │
│  ├── Auto-injects WHERE organization_id = :tenantId         │
│  ├── Applied to all entity queries                          │
│  ├── Impossible to accidentally query cross-tenant          │
│  └── Bypassed only for system/admin operations              │
│                                                             │
│  Layer 4: Service Layer Validation                          │
│  ├── Every entity fetch validates org_id matches            │
│  ├── Defense-in-depth against filter bypass                 │
│  └── Explicit check before update/delete                    │
│                                                             │
│  Layer 5: Supabase RLS (Optional additional layer)          │
│  ├── Row-Level Security policies on critical tables         │
│  ├── Database-level enforcement                             │
│  └── Even raw SQL respects tenant boundaries                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### TenantContext Implementation

```java
public class TenantContext {
    private static final ThreadLocal<UUID> CURRENT_TENANT = new ThreadLocal<>();

    public static void setTenantId(UUID tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static UUID getTenantId() {
        return CURRENT_TENANT.get();
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
```

### Data Security Rules

| Rule | Enforcement |
|------|------------|
| All business data queries include `organization_id` | Hibernate @Filter (automatic) |
| Entity fetch validates tenant match | Service layer (explicit) |
| Create operations set `organization_id` from context | BaseEntity `@PrePersist` |
| Update operations verify tenant match | Service layer (explicit) |
| Delete operations verify tenant match | Service layer (explicit) |
| API responses never leak cross-tenant data | DTO mapping (no lazy-loaded cross-tenant refs) |
| Storage paths include `organization_id` | Storage service (path prefix) |
| AI queries scoped to `organization_id` | AI service (tool parameter) |
| Cache keys include `organization_id` | Cache key generator |
| Audit logs scoped to `organization_id` | AuditService (automatic) |

---

> **Next:** [Chapter 7 — Folder Structure](./07-folder-structure.md)
