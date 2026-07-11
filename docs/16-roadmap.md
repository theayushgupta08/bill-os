# Chapter 16 — Roadmap

> Back to [Index](./README.md) | Prev ← [Deployment Guide](./15-deployment-guide.md) | Next → [Coding Standards](./17-coding-standards.md)

---

## 16.1 Phase Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                         billOS ROADMAP                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Phase 1 (MVP)         Phase 2              Phase 3           Phase 4  │
│  Months 1-4            Months 5-8           Months 9-14       15-24    │
│  ────────────          ────────────          ────────────      ──────── │
│  Core Billing          Payments &            AI Features       Mobile & │
│  & GST                 Analytics                               Platform│
│                                                                        │
│  ▓▓▓▓▓▓▓▓▓▓▓▓          ░░░░░░░░░░░░          ░░░░░░░░░░░░    ░░░░░░░░│
│  IN PROGRESS            PLANNED               PLANNED          FUTURE  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 16.2 Phase 1 — MVP (Months 1–4)

> **Goal:** A fully functional billing platform that an Indian SMB can use to manage customers, suppliers, products, inventory, purchases, sales, GST-compliant invoices, and basic reports.

### Sprint Breakdown

#### Sprint 1 (Weeks 1–2): Foundation

| Task | Deliverable |
|------|------------|
| Project scaffolding | Next.js, Spring Boot, AI service skeleton, Docker Compose |
| Database setup | Supabase project, Flyway migrations for core tables |
| Auth backend | Registration, login, JWT + refresh token, email verification |
| Auth frontend | Login, register, forgot password pages |
| Design system | Tailwind config, shadcn/ui setup, global styles, theme switching |

#### Sprint 2 (Weeks 3–4): Organization & Users

| Task | Deliverable |
|------|------------|
| Organization CRUD | Create org, company profile, GST details |
| Onboarding flow | Post-registration org setup wizard |
| User management | Roles, invite, permissions matrix, RBAC middleware |
| Dashboard layout | Sidebar, header, breadcrumbs, responsive shell |
| Tenant isolation | TenantContext, Hibernate filters, service validation |

#### Sprint 3 (Weeks 5–6): Master Data

| Task | Deliverable |
|------|------------|
| Customer CRUD | List, create, edit, delete, search, import |
| Customer ledger | Transaction history, outstanding calculation |
| Supplier CRUD | Mirroring customer with supplier-specific fields |
| Product CRUD | Categories, HSN/SAC, pricing, tax settings |
| Product categories | Two-level hierarchy management |

#### Sprint 4 (Weeks 7–8): Inventory

| Task | Deliverable |
|------|------------|
| Warehouse setup | Default warehouse, multi-warehouse structure |
| Inventory tracking | Stock levels per product per warehouse |
| Stock movements | Movement history, stock adjustment |
| Low stock alerts | Dashboard widget, reorder level checking |
| Valuation | FIFO / weighted average costing |

#### Sprint 5 (Weeks 9–10): Purchase Management

| Task | Deliverable |
|------|------------|
| Purchase order | Create, edit, status flow, PDF generation |
| Purchase bill | Create (standalone + from PO), auto stock update |
| Tax calculation | CGST/SGST/IGST auto-calculation engine |
| Supplier ledger | Outstanding tracking, payment recording |
| Purchase return | Debit note creation |

#### Sprint 6 (Weeks 11–12): Sales & Invoicing

| Task | Deliverable |
|------|------------|
| Quotation | Create, convert to sales order |
| Sales order | Create, convert to invoice |
| Invoice creation | Full invoice form with line items, tax calculation |
| Invoice PDF | Template-based PDF generation (3 templates) |
| Invoice actions | Send, print, download, void, duplicate |
| Credit notes | From invoice void or sales return |
| Invoice numbering | Sequential, FY-aware, branch-specific |

#### Sprint 7 (Weeks 13–14): GST & Payments

| Task | Deliverable |
|------|------------|
| GST billing engine | All supply types (intra/inter/exempt/nil/reverse charge) |
| E-invoice JSON | FORM INV-01 schema generation |
| HSN summary | Auto-generated HSN-wise tax summary |
| Basic payments | Record payment received/made against invoices |
| Customer outstanding | Auto-update on invoice/payment/credit note |

#### Sprint 8 (Weeks 15–16): Reports, Settings, Polish

| Task | Deliverable |
|------|------------|
| Sales register | Filterable, exportable (PDF/Excel/CSV) |
| Purchase register | Filterable, exportable |
| Stock summary | Current stock with value |
| GST reports | GSTR-1 and GSTR-3B format |
| Outstanding reports | Receivables and payables |
| P&L (basic) | Revenue – purchases |
| Settings | Organization, tax, invoice, preferences |
| Audit logs | View, filter, search |
| Dashboard | Summary cards, recent transactions, low stock, quick actions |
| Bug fixing & polish | E2E testing, performance optimization, UX refinement |

### MVP Exit Criteria

- [ ] User can register, create org, set up GST details
- [ ] Full customer/supplier/product CRUD with search and pagination
- [ ] Inventory tracks stock levels accurately across operations
- [ ] Complete purchase flow (PO → bill → stock update → payment)
- [ ] Complete sales flow (quotation → order → invoice → payment)
- [ ] GST tax calculation correct for all supply types
- [ ] Invoice PDF generated with all required fields + QR placeholder
- [ ] GSTR-1 and GSTR-3B reports generate correctly
- [ ] Dashboard shows accurate real-time data
- [ ] Audit logs track all create/update/delete operations
- [ ] Zero cross-tenant data leakage (validated by integration tests)
- [ ] API response time < 300ms (95th percentile) under load
- [ ] 80%+ backend test coverage, 70%+ frontend

---

## 16.3 Phase 2 — Payments, Analytics & Notifications (Months 5–8)

| Feature | Description |
|---------|-------------|
| **Advanced Payments** | Payment reconciliation, bulk payments, PDC tracking, advance payments |
| **Expense Management** | Categories, record, receipt upload, approval workflow, budgets |
| **Advanced Analytics** | Sales trend, top customers/products, aging analysis, cash flow chart |
| **Enhanced Dashboard** | KPI cards (gross margin, DSO, inventory turnover), interactive charts |
| **Notification Engine** | In-app + email notifications (Resend), payment reminders |
| **Push Notifications** | Firebase Cloud Messaging for real-time alerts |
| **E-way Bill** | E-way bill generation integrated with invoicing |
| **TDS/TCS** | TDS deduction on purchases, TCS on sales (where applicable) |
| **Period Comparison** | Month-over-month, year-over-year report comparisons |
| **Scheduled Reports** | Auto-generate and email reports on schedule |
| **Bulk Operations** | Bulk import/export for products, customers, invoices |
| **Multi-Warehouse** | Full warehouse management, inter-warehouse transfers |
| **MFA** | TOTP-based multi-factor authentication |

---

## 16.4 Phase 3 — AI Features (Months 9–14)

| Feature | Description |
|---------|-------------|
| **AI Service Setup** | FastAPI deployment, LangGraph orchestration, prompt templates |
| **AI Copilot** | Conversational business assistant (data queries, entity lookup, advice) |
| **Invoice OCR** | Upload image/PDF → auto-extract → create purchase bill |
| **Receipt OCR** | Upload receipt → auto-categorize expense |
| **Smart Search** | Natural language search across all data |
| **AI Analytics** | Automated anomaly detection, trend identification |
| **Expense Auto-Categorization** | ML-based expense categorization |
| **Inventory Prediction** | Demand forecasting, reorder suggestions |
| **Sales Forecast** | Revenue projections, growth analysis |
| **Business Health Score** | Composite health metric (0–100) |
| **AI Recommendation Engine** | Pricing, credit limit, discount recommendations |
| **RAG Pipeline** | Document indexing, vector search, knowledge base |
| **Cash Flow Prediction** | 30/60/90 day projected cash position |

---

## 16.5 Phase 4 — Mobile & Platform (Months 15–24)

| Feature | Description |
|---------|-------------|
| **Native Mobile App** | React Native (iOS + Android), offline-first sync |
| **POS (Point of Sale)** | Fast checkout interface, thermal receipt printing |
| **Barcode Scanning** | Camera-based barcode scanning for stock operations |
| **WhatsApp Integration** | Invoice sharing, payment reminders via WhatsApp Business API |
| **Marketplace Integrations** | Amazon, Flipkart, Meesho order sync |
| **Regional Languages** | Hindi + Tamil + Telugu + Marathi UI |
| **Offline-First PWA** | Service worker, background sync, conflict resolution |
| **Advanced AI** | Agentic workflows, voice commands, AI-generated reports |
| **API Marketplace** | Third-party developer API access, webhook system |
| **Tally Integration** | Import/export Tally data for migration |
| **Multi-Currency** | Support for international transactions |
| **Subscription Billing** | Recurring invoices, subscription management |

---

## 16.6 Success Metrics Per Phase

| Metric | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|--------|---------|---------|---------|---------|
| Active Organizations | 50 | 200 | 500 | 2,000 |
| Monthly Active Users | 100 | 500 | 1,500 | 5,000 |
| Invoices Created / Month | 5,000 | 25,000 | 100,000 | 500,000 |
| API p95 Latency | < 300ms | < 300ms | < 300ms | < 300ms |
| Uptime | 99.5% | 99.9% | 99.9% | 99.95% |
| NPS Score | ≥ 30 | ≥ 40 | ≥ 50 | ≥ 60 |
| AI Engagement (P3+) | — | — | 40% weekly | 60% weekly |
| MRR | ₹50K | ₹2.5L | ₹10L | ₹50L |

---

> **Next:** [Chapter 17 — Coding Standards](./17-coding-standards.md)
