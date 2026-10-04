# Chapter 2 — Product Scope

> Back to [Index](./README.md) | Prev ← [Project Overview](./01-project-overview.md) | Next → [Product Features](./03-product-features.md)

---

## 2.1 In Scope — MVP (Phase 1)

The MVP delivers the **core billing and compliance loop**: a business owner can sign up, set up their organization with GST details, manage customers/suppliers/products, create purchases and sales, generate GST-compliant invoices, and view essential reports.

### MVP Feature Set

| Module | Features | Priority |
|--------|----------|----------|
| **Authentication** | Email/Password login, registration, email verification, JWT + refresh tokens, session management | P0 — Critical |
| **Organization Management** | Create organization, company profile, GST details (GSTIN, state code, trade name), financial year setup | P0 — Critical |
| **User Management** | Owner + Admin + Accountant + Staff roles, role-based permission matrix, invite users | P0 — Critical |
| **Customer Management** | CRUD, customer ledger, outstanding balance, credit limit, purchase history | P0 — Critical |
| **Supplier Management** | CRUD, supplier ledger, outstanding balance, payment history | P0 — Critical |
| **Product Management** | CRUD, categories, HSN/SAC codes, GST rates, unit of measure, pricing (MRP, selling, purchase), images | P0 — Critical |
| **Inventory Management** | Stock tracking, stock-in/stock-out, low stock alerts, stock valuation (FIFO/weighted avg), stock adjustment | P0 — Critical |
| **Purchase Management** | Purchase order, purchase bill, goods received note (GRN), purchase return, supplier payment tracking | P0 — Critical |
| **Sales Management** | Quotation → Sales order → Delivery challan → Invoice flow, sales return (credit note), customer payment tracking | P0 — Critical |
| **GST Billing** | Tax invoice, e-invoice JSON generation (FORM INV-01), IRN/QR code embedding, credit note, debit note, HSN summary, tax summary | P0 — Critical |
| **Invoice Management** | PDF generation, email invoice, print, invoice templates, invoice numbering series, duplicate/proforma invoice | P0 — Critical |
| **Dashboard** | Revenue/expense overview, pending payments, recent transactions, low stock alerts | P1 — Important |
| **Reports** | Sales register, purchase register, stock summary, GST reports (GSTR-1, GSTR-3B format), profit & loss (basic), outstanding reports | P1 — Important |
| **Settings** | Organization settings, tax settings, invoice settings, user preferences | P1 — Important |
| **Audit Logs** | Track all create/update/delete operations with user, timestamp, old/new values | P1 — Important |

### MVP Technical Requirements

| Area | Requirement |
|------|-------------|
| Multi-tenancy | Shared database, `organization_id` discriminator column on all business tables |
| Authentication | JWT (RS256) + Refresh tokens + RBAC |
| API | RESTful, versioned (`/api/v1/`), OpenAPI 3.0 documented |
| Database | Supabase PostgreSQL, Flyway migrations, UUID primary keys |
| Frontend | Next.js 14+ App Router, TypeScript strict mode, shadcn/ui |
| Backend | Java 25 + Spring Boot 3.5+, Spring Security 6, Spring Data JPA |
| Deployment | Docker Compose (local dev), Vercel (frontend), Railway/Render (backend) |

---

## 2.2 Out of Scope (Explicitly Excluded from MVP)

The following are **not** included in the MVP. They are either planned for later phases or considered out-of-scope entirely.

| Feature | Reason | Planned Phase |
|---------|--------|---------------|
| AI Copilot & Chat | Requires stable data foundation first | Phase 3 |
| Invoice OCR / Receipt OCR | Dependent on AI service infrastructure | Phase 3 |
| Payment Gateway Integration | Regulatory complexity; manual payment recording suffices for MVP | Phase 2 |
| Subscription/Recurring Billing | Niche use case; prioritize one-time invoicing | Phase 2 |
| Expense Management | Secondary to core billing flow | Phase 2 |
| Notification Center (push/email/WhatsApp) | Can use basic email for MVP; full notification engine in P2 | Phase 2 |
| Advanced Analytics & Dashboards | Basic dashboard in MVP; advanced charts/KPIs in P2 | Phase 2 |
| Mobile Native App (iOS/Android) | PWA responsive design covers mobile use in MVP | Phase 4 |
| POS (Point of Sale) | Requires hardware integration planning | Phase 4 |
| Barcode Scanning | Tied to POS and mobile native | Phase 4 |
| WhatsApp Business API | Messaging platform integration complexity | Phase 4 |
| Marketplace Integrations (Amazon, Flipkart) | Requires partner agreements and API contracts | Phase 4 |
| Multi-Currency | India-first; INR only for MVP | Future |
| Payroll | Outside billing domain; potential partnership | Future |
| CRM | Basic customer management suffices; full CRM is a separate product | Future |
| Regional Language UI | English-first MVP; Hindi + regional in P4 | Phase 4 |
| Offline-First / PWA Sync | Requires service worker + conflict resolution | Phase 4 |
| E-way Bill Generation | Complex logistics integration | Phase 2 |
| TDS/TCS Management | Specialized tax compliance | Phase 2 |

---

## 2.3 Future Scope — AI Features (Phase 3+)

billOS's long-term differentiation is its **AI-native architecture**. The following AI capabilities are planned:

### AI Feature Roadmap

```
Phase 3 (AI Foundation)
├── AI Copilot Chat (conversational business assistant)
├── Invoice OCR (scan → auto-create invoice)
├── Receipt OCR (scan → auto-categorize expense)
├── Smart Search (natural language → data lookup)
├── AI Analytics (auto-generated insights & anomaly detection)
└── Expense Auto-Categorization

Phase 3.5 (AI Intelligence)
├── Inventory Prediction (demand forecasting → reorder suggestions)
├── Sales Forecast (trend analysis → revenue projections)
├── Business Health Score (composite metric: cash flow + inventory + receivables)
├── AI Recommendation Engine (pricing, credit limits, supplier selection)
└── Cash Flow Prediction

Phase 4 (AI Platform)
├── AI Document Understanding (parse any business document)
├── AI Knowledge Base (RAG over business documents)
├── AI-generated Reports (natural language → PDF report)
├── Agentic Workflows (AI autonomously executes multi-step tasks)
└── Voice Commands (speech → action)
```

### AI Architecture Preview

```
┌──────────────────────────────────────────────────────────┐
│                    AI Service (Python/FastAPI)            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  LangGraph   │  │  LangChain  │  │  Custom Agents  │  │
│  │  (Orchestr.) │  │  (Chains)   │  │  (Tools)        │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│         │                │                   │           │
│  ┌──────┴────────────────┴───────────────────┴──────┐    │
│  │              Model Router                         │    │
│  │  Claude (primary) │ OpenAI (fallback) │ Gemini    │    │
│  └──────────────────────────────────────────────────┘    │
│         │                                                │
│  ┌──────┴──────────────────────────────────────┐         │
│  │           RAG Pipeline                       │         │
│  │  Document Loader → Chunker → Embedder →      │         │
│  │  pgvector Store → Retriever → Reranker       │         │
│  └──────────────────────────────────────────────┘         │
│         │                                                │
│  ┌──────┴──────────────────────────────────────┐         │
│  │           OCR Pipeline                       │         │
│  │  Image → Preprocessing → Claude Vision →     │         │
│  │  Structured Extraction → Validation          │         │
│  └──────────────────────────────────────────────┘         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 2.4 Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Dashboard initial load | < 2 seconds | Lighthouse, RUM |
| API response time (95th percentile) | < 300 ms | Prometheus histograms |
| API response time (99th percentile) | < 1 second | Prometheus histograms |
| Invoice PDF generation | < 5 seconds | Server-side timing |
| AI Chat first token | < 3 seconds | Client-side timing |
| Database query (indexed lookup) | < 100 ms | Query execution plans |
| Concurrent users per org | ≥ 50 | Load testing (k6) |
| File upload (invoice/receipt image) | < 10 MB, < 5 seconds | Client + server timing |

### Scalability

| Dimension | Target |
|-----------|--------|
| Organizations (tenants) | 10,000+ on shared infrastructure |
| Products per organization | 100,000+ |
| Invoices per organization per year | 500,000+ |
| Total database size | 500 GB+ before sharding consideration |
| API requests per minute (platform) | 10,000+ |

### Availability & Reliability

| Metric | Target |
|--------|--------|
| Uptime (monthly) | 99.9% (≤ 43 min downtime/month) |
| Recovery Time Objective (RTO) | < 1 hour |
| Recovery Point Objective (RPO) | < 15 minutes (database backup frequency) |
| Backup frequency | Every 15 minutes (WAL-based continuous archiving) |
| Backup retention | 30 days (daily snapshots) + 1 year (monthly snapshots) |
| Disaster Recovery | Cross-region replica (Supabase managed) |

### Security

| Requirement | Detail |
|------------|--------|
| Authentication | JWT (RS256) + Refresh tokens + MFA (TOTP) in P2 |
| Authorization | RBAC with per-endpoint permission checks |
| Data encryption at rest | AES-256 (Supabase managed) |
| Data encryption in transit | TLS 1.3 (enforced via Cloudflare + backend HTTPS) |
| Password policy | Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char |
| Password hashing | BCrypt (cost factor 12) |
| Rate limiting | 100 requests/minute per user, 1000/minute per organization |
| OWASP Top 10 compliance | Mandatory — validated via penetration testing |
| Data residency | India (Mumbai region) |
| PII handling | Encrypted at rest, masked in logs, RBAC-restricted |

### Compatibility

| Platform | Minimum Version |
|----------|----------------|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 15+ |
| Edge | 90+ |
| Mobile (responsive) | iOS Safari 15+, Chrome Mobile 90+ |
| Screen resolution | 360px (mobile) to 4K (desktop) |

### Maintainability

| Metric | Target |
|--------|--------|
| Code coverage (unit tests) | ≥ 80% (backend), ≥ 70% (frontend) |
| Code coverage (integration tests) | ≥ 60% (critical paths) |
| Documentation coverage | 100% of public API endpoints |
| Build time | < 5 minutes (CI/CD full pipeline) |
| Deploy time | < 10 minutes (zero-downtime rolling update) |

### Internationalization (i18n) — Future

| Capability | Status |
|-----------|--------|
| Currency: INR | MVP |
| Currency: Multi-currency | Future |
| Language: English | MVP |
| Language: Hindi | Phase 4 |
| Language: Regional (Tamil, Telugu, Marathi, etc.) | Future |
| Date format: DD/MM/YYYY (Indian) | MVP |
| Number format: Indian (12,34,567.89) | MVP |
| GST: Indian tax system | MVP |
| Tax: Other country tax systems | Future |

---

> **Next:** [Chapter 3 — Product Features](./03-product-features.md)
