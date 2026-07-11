# Chapter 7 — Folder Structure

> Back to [Index](./README.md) | Prev ← [System Architecture](./06-system-architecture.md) | Next → [Database Design](./08-database-design.md)

---

## 7.1 Monorepo Root Structure

```
billOS/
├── docs/                          # This architecture handbook
│   ├── README.md                  # Index / table of contents
│   ├── 01-project-overview.md
│   ├── ...
│   └── 18-performance-targets.md
│
├── frontend/                      # Next.js application
├── backend/                       # Spring Boot application
├── ai-service/                    # Python FastAPI AI service
│
├── docker/                        # Docker configurations
│   ├── docker-compose.yml         # Local dev (all services)
│   ├── docker-compose.prod.yml    # Production overrides
│   ├── backend/
│   │   └── Dockerfile
│   ├── ai-service/
│   │   └── Dockerfile
│   └── nginx/
│       ├── Dockerfile
│       └── nginx.conf
│
├── .github/                       # GitHub configuration
│   ├── workflows/
│   │   ├── ci.yml                 # Build + test on PR
│   │   ├── deploy-staging.yml     # Deploy to staging
│   │   ├── deploy-production.yml  # Deploy to production
│   │   └── ai-service-ci.yml     # AI service pipeline
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
│
├── scripts/                       # Dev utility scripts
│   ├── setup-dev.sh               # One-command dev setup
│   ├── seed-data.sql              # Sample data for development
│   └── generate-api-client.sh     # OpenAPI → TypeScript client
│
├── .gitignore
├── .editorconfig
├── README.md                      # Project README
└── LICENSE
```

---

## 7.2 Frontend Structure (Next.js App Router)

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   ├── og-image.png               # Social sharing image
│   └── manifest.json              # PWA manifest
│
├── src/
│   ├── app/                       # Next.js App Router (pages + layouts)
│   │   ├── layout.tsx             # Root layout (providers, fonts, metadata)
│   │   ├── page.tsx               # Landing page (marketing)
│   │   ├── loading.tsx            # Global loading state
│   │   ├── error.tsx              # Global error boundary
│   │   ├── not-found.tsx          # 404 page
│   │   │
│   │   ├── (auth)/                # Auth group (no sidebar layout)
│   │   │   ├── layout.tsx         # Auth layout (centered card)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx
│   │   │   └── verify-email/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (onboarding)/          # Post-registration onboarding
│   │   │   ├── layout.tsx
│   │   │   └── setup-organization/
│   │   │       └── page.tsx
│   │   │
│   │   └── (dashboard)/           # Main app (sidebar + header layout)
│   │       ├── layout.tsx         # Dashboard layout (sidebar, header, breadcrumbs)
│   │       ├── dashboard/
│   │       │   └── page.tsx       # Main dashboard
│   │       │
│   │       ├── customers/
│   │       │   ├── page.tsx       # Customer list
│   │       │   ├── new/
│   │       │   │   └── page.tsx   # Create customer
│   │       │   └── [id]/
│   │       │       ├── page.tsx   # Customer detail
│   │       │       ├── edit/
│   │       │       │   └── page.tsx
│   │       │       └── ledger/
│   │       │           └── page.tsx
│   │       │
│   │       ├── suppliers/
│   │       │   ├── page.tsx
│   │       │   ├── new/
│   │       │   │   └── page.tsx
│   │       │   └── [id]/
│   │       │       ├── page.tsx
│   │       │       ├── edit/
│   │       │       │   └── page.tsx
│   │       │       └── ledger/
│   │       │           └── page.tsx
│   │       │
│   │       ├── products/
│   │       │   ├── page.tsx
│   │       │   ├── new/
│   │       │   │   └── page.tsx
│   │       │   ├── [id]/
│   │       │   │   ├── page.tsx
│   │       │   │   └── edit/
│   │       │   │       └── page.tsx
│   │       │   └── categories/
│   │       │       └── page.tsx
│   │       │
│   │       ├── inventory/
│   │       │   ├── page.tsx       # Stock summary
│   │       │   ├── adjustments/
│   │       │   │   └── page.tsx
│   │       │   └── transfers/
│   │       │       └── page.tsx
│   │       │
│   │       ├── purchases/
│   │       │   ├── page.tsx       # Purchase list
│   │       │   ├── orders/
│   │       │   │   ├── page.tsx
│   │       │   │   ├── new/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── [id]/
│   │       │   │       └── page.tsx
│   │       │   ├── bills/
│   │       │   │   ├── page.tsx
│   │       │   │   ├── new/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── [id]/
│   │       │   │       └── page.tsx
│   │       │   └── returns/
│   │       │       └── page.tsx
│   │       │
│   │       ├── sales/
│   │       │   ├── page.tsx
│   │       │   ├── quotations/
│   │       │   │   ├── page.tsx
│   │       │   │   ├── new/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── [id]/
│   │       │   │       └── page.tsx
│   │       │   ├── orders/
│   │       │   │   ├── page.tsx
│   │       │   │   ├── new/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── [id]/
│   │       │   │       └── page.tsx
│   │       │   └── returns/
│   │       │       └── page.tsx
│   │       │
│   │       ├── invoices/
│   │       │   ├── page.tsx       # Invoice list
│   │       │   ├── new/
│   │       │   │   └── page.tsx   # Create invoice
│   │       │   └── [id]/
│   │       │       ├── page.tsx   # Invoice detail + PDF preview
│   │       │       └── edit/
│   │       │           └── page.tsx
│   │       │
│   │       ├── payments/
│   │       │   ├── page.tsx
│   │       │   └── new/
│   │       │       └── page.tsx
│   │       │
│   │       ├── expenses/          # [P2]
│   │       │   ├── page.tsx
│   │       │   └── new/
│   │       │       └── page.tsx
│   │       │
│   │       ├── reports/
│   │       │   ├── page.tsx       # Report hub
│   │       │   ├── sales/
│   │       │   │   └── page.tsx
│   │       │   ├── purchases/
│   │       │   │   └── page.tsx
│   │       │   ├── inventory/
│   │       │   │   └── page.tsx
│   │       │   ├── gst/
│   │       │   │   ├── gstr-1/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── gstr-3b/
│   │       │   │       └── page.tsx
│   │       │   ├── outstanding/
│   │       │   │   └── page.tsx
│   │       │   └── profit-loss/
│   │       │       └── page.tsx
│   │       │
│   │       ├── ai/                # [P3]
│   │       │   ├── chat/
│   │       │   │   └── page.tsx
│   │       │   └── insights/
│   │       │       └── page.tsx
│   │       │
│   │       ├── settings/
│   │       │   ├── page.tsx       # Settings hub
│   │       │   ├── organization/
│   │       │   │   └── page.tsx
│   │       │   ├── gst/
│   │       │   │   └── page.tsx
│   │       │   ├── invoice/
│   │       │   │   └── page.tsx
│   │       │   ├── users/
│   │       │   │   └── page.tsx
│   │       │   └── preferences/
│   │       │       └── page.tsx
│   │       │
│   │       └── audit-logs/
│   │           └── page.tsx
│   │
│   ├── components/                # Shared UI components
│   │   ├── ui/                    # shadcn/ui primitives (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   ├── select.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── command.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── form.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                # Layout components
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── breadcrumbs.tsx
│   │   │   ├── page-header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── mobile-nav.tsx
│   │   │
│   │   ├── shared/                # Reusable business components
│   │   │   ├── data-table.tsx     # Generic sortable/filterable table
│   │   │   ├── date-range-picker.tsx
│   │   │   ├── search-input.tsx
│   │   │   ├── status-badge.tsx
│   │   │   ├── amount-display.tsx # Indian number format
│   │   │   ├── empty-state.tsx
│   │   │   ├── loading-state.tsx
│   │   │   ├── error-state.tsx
│   │   │   ├── confirm-dialog.tsx
│   │   │   ├── file-upload.tsx
│   │   │   ├── image-upload.tsx
│   │   │   ├── org-switcher.tsx
│   │   │   ├── user-avatar.tsx
│   │   │   ├── currency-input.tsx
│   │   │   ├── gstin-input.tsx    # GSTIN validation input
│   │   │   ├── hsn-select.tsx     # HSN code searchable select
│   │   │   ├── address-form.tsx   # Reusable address fields
│   │   │   └── pdf-viewer.tsx
│   │   │
│   │   └── charts/                # Dashboard chart components
│   │       ├── revenue-chart.tsx
│   │       ├── expense-chart.tsx
│   │       ├── cash-flow-chart.tsx
│   │       ├── inventory-chart.tsx
│   │       └── kpi-card.tsx
│   │
│   ├── features/                  # Feature-specific components & logic
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── login-form.tsx
│   │   │   │   ├── register-form.tsx
│   │   │   │   └── forgot-password-form.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-auth.ts
│   │   │   └── schemas/
│   │   │       └── auth.schema.ts # Zod schemas
│   │   │
│   │   ├── customers/
│   │   │   ├── components/
│   │   │   │   ├── customer-form.tsx
│   │   │   │   ├── customer-table.tsx
│   │   │   │   ├── customer-detail.tsx
│   │   │   │   └── customer-ledger.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-customers.ts
│   │   │   └── schemas/
│   │   │       └── customer.schema.ts
│   │   │
│   │   ├── invoices/
│   │   │   ├── components/
│   │   │   │   ├── invoice-form.tsx
│   │   │   │   ├── invoice-table.tsx
│   │   │   │   ├── invoice-detail.tsx
│   │   │   │   ├── invoice-pdf-preview.tsx
│   │   │   │   ├── line-item-row.tsx
│   │   │   │   └── tax-summary.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-invoices.ts
│   │   │   └── schemas/
│   │   │       └── invoice.schema.ts
│   │   │
│   │   ├── products/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── schemas/
│   │   │
│   │   ├── inventory/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── schemas/
│   │   │
│   │   ├── purchases/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── schemas/
│   │   │
│   │   ├── sales/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── schemas/
│   │   │
│   │   ├── payments/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── schemas/
│   │   │
│   │   ├── reports/
│   │   │   ├── components/
│   │   │   └── hooks/
│   │   │
│   │   ├── settings/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── schemas/
│   │   │
│   │   └── ai/                    # [P3]
│   │       ├── components/
│   │       │   ├── chat-interface.tsx
│   │       │   ├── chat-message.tsx
│   │       │   └── ai-insight-card.tsx
│   │       └── hooks/
│   │           └── use-ai-chat.ts
│   │
│   ├── hooks/                     # Global custom hooks
│   │   ├── use-debounce.ts
│   │   ├── use-local-storage.ts
│   │   ├── use-media-query.ts
│   │   ├── use-pagination.ts
│   │   ├── use-toast.ts
│   │   └── use-theme.ts
│   │
│   ├── lib/                       # Utilities and configurations
│   │   ├── api-client.ts          # Axios/fetch wrapper with JWT
│   │   ├── query-client.ts        # TanStack Query configuration
│   │   ├── utils.ts               # cn(), formatCurrency(), etc.
│   │   ├── constants.ts           # App-wide constants
│   │   ├── validators.ts          # Shared Zod schemas
│   │   └── format.ts              # Indian number format, date format
│   │
│   ├── services/                  # API service functions
│   │   ├── auth.service.ts
│   │   ├── customer.service.ts
│   │   ├── supplier.service.ts
│   │   ├── product.service.ts
│   │   ├── inventory.service.ts
│   │   ├── invoice.service.ts
│   │   ├── purchase.service.ts
│   │   ├── sale.service.ts
│   │   ├── payment.service.ts
│   │   ├── report.service.ts
│   │   ├── settings.service.ts
│   │   └── ai.service.ts
│   │
│   ├── stores/                    # Zustand stores
│   │   ├── auth.store.ts          # User + token state
│   │   ├── org.store.ts           # Current organization
│   │   ├── ui.store.ts            # Sidebar, modals, theme
│   │   └── notification.store.ts
│   │
│   ├── types/                     # TypeScript type definitions
│   │   ├── api.types.ts           # API response wrappers
│   │   ├── auth.types.ts
│   │   ├── customer.types.ts
│   │   ├── supplier.types.ts
│   │   ├── product.types.ts
│   │   ├── inventory.types.ts
│   │   ├── invoice.types.ts
│   │   ├── purchase.types.ts
│   │   ├── sale.types.ts
│   │   ├── payment.types.ts
│   │   ├── report.types.ts
│   │   ├── settings.types.ts
│   │   └── common.types.ts        # Shared enums, Pagination, etc.
│   │
│   └── styles/
│       └── globals.css            # Tailwind directives + CSS variables
│
├── .env.local                     # Local environment variables
├── .env.example                   # Template for env vars
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── components.json                # shadcn/ui configuration
├── package.json
└── package-lock.json
```

---

## 7.3 Backend Structure (Spring Boot)

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/billos/api/
│   │   │   │
│   │   │   ├── BillOsApplication.java           # Main entry point
│   │   │   │
│   │   │   ├── config/                           # Configuration
│   │   │   │   ├── SecurityConfig.java           # Spring Security config
│   │   │   │   ├── CorsConfig.java               # CORS settings
│   │   │   │   ├── JwtConfig.java                # JWT properties
│   │   │   │   ├── RedisConfig.java              # Redis connection
│   │   │   │   ├── CacheConfig.java              # Caffeine + Redis cache
│   │   │   │   ├── OpenApiConfig.java            # Springdoc/Swagger config
│   │   │   │   ├── JacksonConfig.java            # JSON serialization
│   │   │   │   ├── WebMvcConfig.java             # Interceptors, formatters
│   │   │   │   ├── AsyncConfig.java              # Async task executor
│   │   │   │   ├── AuditConfig.java              # JPA Auditing
│   │   │   │   └── StorageConfig.java            # Supabase Storage client
│   │   │   │
│   │   │   ├── security/                         # Security components
│   │   │   │   ├── JwtTokenProvider.java         # JWT creation + validation
│   │   │   │   ├── JwtAuthenticationFilter.java  # OncePerRequestFilter
│   │   │   │   ├── TenantFilter.java             # Extract org_id, set TenantContext
│   │   │   │   ├── TenantContext.java            # ThreadLocal tenant holder
│   │   │   │   ├── CustomUserDetails.java        # UserDetails implementation
│   │   │   │   ├── CustomUserDetailsService.java # Load user from DB
│   │   │   │   ├── PermissionEvaluator.java      # RBAC permission checks
│   │   │   │   └── RateLimitFilter.java          # Redis-based rate limiting
│   │   │   │
│   │   │   ├── controller/                       # REST API controllers
│   │   │   │   ├── AuthController.java           # /api/v1/auth/*
│   │   │   │   ├── OrganizationController.java   # /api/v1/organizations/*
│   │   │   │   ├── UserController.java           # /api/v1/users/*
│   │   │   │   ├── CustomerController.java       # /api/v1/customers/*
│   │   │   │   ├── SupplierController.java       # /api/v1/suppliers/*
│   │   │   │   ├── ProductController.java        # /api/v1/products/*
│   │   │   │   ├── CategoryController.java       # /api/v1/categories/*
│   │   │   │   ├── InventoryController.java      # /api/v1/inventory/*
│   │   │   │   ├── WarehouseController.java      # /api/v1/warehouses/*
│   │   │   │   ├── PurchaseOrderController.java  # /api/v1/purchase-orders/*
│   │   │   │   ├── PurchaseBillController.java   # /api/v1/purchase-bills/*
│   │   │   │   ├── QuotationController.java      # /api/v1/quotations/*
│   │   │   │   ├── SalesOrderController.java     # /api/v1/sales-orders/*
│   │   │   │   ├── InvoiceController.java        # /api/v1/invoices/*
│   │   │   │   ├── CreditNoteController.java     # /api/v1/credit-notes/*
│   │   │   │   ├── DebitNoteController.java      # /api/v1/debit-notes/*
│   │   │   │   ├── PaymentController.java        # /api/v1/payments/*
│   │   │   │   ├── ExpenseController.java        # /api/v1/expenses/*
│   │   │   │   ├── ReportController.java         # /api/v1/reports/*
│   │   │   │   ├── DashboardController.java      # /api/v1/dashboard/*
│   │   │   │   ├── SettingsController.java       # /api/v1/settings/*
│   │   │   │   ├── AuditLogController.java       # /api/v1/audit-logs/*
│   │   │   │   └── AiProxyController.java        # /api/v1/ai/* (proxy to AI service)
│   │   │   │
│   │   │   ├── service/                          # Business logic
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── OrganizationService.java
│   │   │   │   ├── UserService.java
│   │   │   │   ├── CustomerService.java
│   │   │   │   ├── SupplierService.java
│   │   │   │   ├── ProductService.java
│   │   │   │   ├── CategoryService.java
│   │   │   │   ├── InventoryService.java
│   │   │   │   ├── WarehouseService.java
│   │   │   │   ├── PurchaseOrderService.java
│   │   │   │   ├── PurchaseBillService.java
│   │   │   │   ├── QuotationService.java
│   │   │   │   ├── SalesOrderService.java
│   │   │   │   ├── InvoiceService.java
│   │   │   │   ├── InvoiceNumberService.java     # Sequential numbering logic
│   │   │   │   ├── GstCalculationService.java    # Tax calculation engine
│   │   │   │   ├── EInvoiceService.java          # IRP API integration
│   │   │   │   ├── PdfGenerationService.java     # Invoice PDF rendering
│   │   │   │   ├── CreditNoteService.java
│   │   │   │   ├── DebitNoteService.java
│   │   │   │   ├── PaymentService.java
│   │   │   │   ├── LedgerService.java            # Customer/supplier ledger
│   │   │   │   ├── ExpenseService.java
│   │   │   │   ├── ReportService.java
│   │   │   │   ├── DashboardService.java
│   │   │   │   ├── SettingsService.java
│   │   │   │   ├── AuditLogService.java
│   │   │   │   ├── EmailService.java             # Resend integration
│   │   │   │   ├── StorageService.java           # Supabase Storage
│   │   │   │   └── CacheService.java             # Cache management
│   │   │   │
│   │   │   ├── repository/                       # Data access layer
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── OrganizationRepository.java
│   │   │   │   ├── UserOrgRoleRepository.java
│   │   │   │   ├── CustomerRepository.java
│   │   │   │   ├── SupplierRepository.java
│   │   │   │   ├── ProductRepository.java
│   │   │   │   ├── CategoryRepository.java
│   │   │   │   ├── InventoryRepository.java
│   │   │   │   ├── WarehouseRepository.java
│   │   │   │   ├── PurchaseOrderRepository.java
│   │   │   │   ├── PurchaseBillRepository.java
│   │   │   │   ├── QuotationRepository.java
│   │   │   │   ├── SalesOrderRepository.java
│   │   │   │   ├── InvoiceRepository.java
│   │   │   │   ├── InvoiceItemRepository.java
│   │   │   │   ├── CreditNoteRepository.java
│   │   │   │   ├── DebitNoteRepository.java
│   │   │   │   ├── PaymentRepository.java
│   │   │   │   ├── ExpenseRepository.java
│   │   │   │   ├── AuditLogRepository.java
│   │   │   │   ├── RefreshTokenRepository.java
│   │   │   │   └── SettingsRepository.java
│   │   │   │
│   │   │   ├── entity/                           # JPA entities
│   │   │   │   ├── base/
│   │   │   │   │   ├── BaseEntity.java           # id, createdAt, updatedAt, version
│   │   │   │   │   └── TenantEntity.java         # BaseEntity + organizationId + softDelete
│   │   │   │   ├── User.java
│   │   │   │   ├── Organization.java
│   │   │   │   ├── UserOrgRole.java
│   │   │   │   ├── Customer.java
│   │   │   │   ├── Supplier.java
│   │   │   │   ├── Product.java
│   │   │   │   ├── ProductCategory.java
│   │   │   │   ├── Inventory.java
│   │   │   │   ├── InventoryMovement.java
│   │   │   │   ├── Warehouse.java
│   │   │   │   ├── PurchaseOrder.java
│   │   │   │   ├── PurchaseOrderItem.java
│   │   │   │   ├── PurchaseBill.java
│   │   │   │   ├── PurchaseBillItem.java
│   │   │   │   ├── Quotation.java
│   │   │   │   ├── QuotationItem.java
│   │   │   │   ├── SalesOrder.java
│   │   │   │   ├── SalesOrderItem.java
│   │   │   │   ├── Invoice.java
│   │   │   │   ├── InvoiceItem.java
│   │   │   │   ├── CreditNote.java
│   │   │   │   ├── CreditNoteItem.java
│   │   │   │   ├── DebitNote.java
│   │   │   │   ├── DebitNoteItem.java
│   │   │   │   ├── Payment.java
│   │   │   │   ├── Expense.java
│   │   │   │   ├── AuditLog.java
│   │   │   │   ├── RefreshToken.java
│   │   │   │   ├── Settings.java
│   │   │   │   └── InvoiceNumberSequence.java
│   │   │   │
│   │   │   ├── dto/                              # Data Transfer Objects
│   │   │   │   ├── request/                      # Incoming request DTOs
│   │   │   │   │   ├── auth/
│   │   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   │   ├── RegisterRequest.java
│   │   │   │   │   │   ├── ForgotPasswordRequest.java
│   │   │   │   │   │   └── ResetPasswordRequest.java
│   │   │   │   │   ├── CustomerRequest.java
│   │   │   │   │   ├── SupplierRequest.java
│   │   │   │   │   ├── ProductRequest.java
│   │   │   │   │   ├── InvoiceRequest.java
│   │   │   │   │   ├── InvoiceItemRequest.java
│   │   │   │   │   ├── PaymentRequest.java
│   │   │   │   │   └── ...
│   │   │   │   │
│   │   │   │   └── response/                     # Outgoing response DTOs
│   │   │   │       ├── ApiResponse.java          # Standard wrapper
│   │   │   │       ├── PagedResponse.java        # Paginated wrapper
│   │   │   │       ├── AuthResponse.java
│   │   │   │       ├── CustomerResponse.java
│   │   │   │       ├── SupplierResponse.java
│   │   │   │       ├── ProductResponse.java
│   │   │   │       ├── InvoiceResponse.java
│   │   │   │       ├── InvoiceSummaryResponse.java
│   │   │   │       ├── PaymentResponse.java
│   │   │   │       ├── DashboardResponse.java
│   │   │   │       ├── LedgerEntryResponse.java
│   │   │   │       └── ...
│   │   │   │
│   │   │   ├── mapper/                           # MapStruct mappers
│   │   │   │   ├── CustomerMapper.java
│   │   │   │   ├── SupplierMapper.java
│   │   │   │   ├── ProductMapper.java
│   │   │   │   ├── InvoiceMapper.java
│   │   │   │   ├── PaymentMapper.java
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── exception/                        # Exception handling
│   │   │   │   ├── GlobalExceptionHandler.java   # @ControllerAdvice
│   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   ├── DuplicateResourceException.java
│   │   │   │   ├── BusinessRuleException.java
│   │   │   │   ├── UnauthorizedException.java
│   │   │   │   ├── ForbiddenException.java
│   │   │   │   ├── RateLimitExceededException.java
│   │   │   │   ├── TenantMismatchException.java
│   │   │   │   └── ErrorCode.java                # Enum of all error codes
│   │   │   │
│   │   │   ├── enums/                            # Enumerations
│   │   │   │   ├── Role.java
│   │   │   │   ├── Permission.java
│   │   │   │   ├── InvoiceStatus.java
│   │   │   │   ├── PaymentMode.java
│   │   │   │   ├── PaymentStatus.java
│   │   │   │   ├── GstRate.java
│   │   │   │   ├── GstRegistrationType.java
│   │   │   │   ├── BusinessType.java
│   │   │   │   ├── UnitOfMeasure.java
│   │   │   │   ├── IndianState.java
│   │   │   │   └── ...
│   │   │   │
│   │   │   ├── validator/                        # Custom validators
│   │   │   │   ├── GstinValidator.java           # GSTIN format + checksum
│   │   │   │   ├── PanValidator.java
│   │   │   │   ├── IndianPhoneValidator.java
│   │   │   │   └── HsnCodeValidator.java
│   │   │   │
│   │   │   ├── event/                            # Domain events
│   │   │   │   ├── InvoiceCreatedEvent.java
│   │   │   │   ├── PaymentReceivedEvent.java
│   │   │   │   ├── StockUpdatedEvent.java
│   │   │   │   └── AuditEventListener.java
│   │   │   │
│   │   │   └── util/                             # Utility classes
│   │   │       ├── IndianNumberFormat.java       # ₹12,34,567.89
│   │   │       ├── AmountToWords.java            # Number → words converter
│   │   │       ├── GstCalculator.java            # Tax computation helper
│   │   │       ├── DateUtils.java                # Indian date formatting
│   │   │       └── SlugGenerator.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml                   # Main config
│   │       ├── application-dev.yml               # Dev profile
│   │       ├── application-staging.yml           # Staging profile
│   │       ├── application-prod.yml              # Prod profile
│   │       ├── db/
│   │       │   └── migration/                    # Flyway migrations
│   │       │       ├── V001__create_users_table.sql
│   │       │       ├── V002__create_organizations_table.sql
│   │       │       ├── V003__create_user_org_roles_table.sql
│   │       │       ├── V004__create_customers_table.sql
│   │       │       ├── V005__create_suppliers_table.sql
│   │       │       ├── V006__create_products_table.sql
│   │       │       ├── V007__create_inventory_tables.sql
│   │       │       ├── V008__create_purchase_tables.sql
│   │       │       ├── V009__create_sales_tables.sql
│   │       │       ├── V010__create_invoice_tables.sql
│   │       │       ├── V011__create_payment_tables.sql
│   │       │       ├── V012__create_audit_log_table.sql
│   │       │       ├── V013__create_settings_table.sql
│   │       │       ├── V014__create_refresh_tokens_table.sql
│   │       │       └── V015__seed_default_data.sql
│   │       ├── templates/
│   │       │   └── pdf/                          # Invoice PDF templates
│   │       │       ├── invoice-classic.html
│   │       │       ├── invoice-modern.html
│   │       │       └── invoice-compact.html
│   │       ├── keys/
│   │       │   ├── jwt-private.pem               # RS256 private key (git-ignored)
│   │       │   └── jwt-public.pem                # RS256 public key
│   │       └── data/
│   │           ├── hsn-codes.json                # HSN code reference data
│   │           ├── indian-states.json            # State code reference
│   │           └── gst-rates.json                # GST rate reference
│   │
│   └── test/
│       └── java/com/billos/api/
│           ├── controller/                       # Controller integration tests
│           │   ├── AuthControllerTest.java
│           │   ├── CustomerControllerTest.java
│           │   └── InvoiceControllerTest.java
│           ├── service/                          # Service unit tests
│           │   ├── CustomerServiceTest.java
│           │   ├── InvoiceServiceTest.java
│           │   ├── GstCalculationServiceTest.java
│           │   └── InvoiceNumberServiceTest.java
│           ├── repository/                       # Repository integration tests
│           │   ├── CustomerRepositoryTest.java
│           │   └── InvoiceRepositoryTest.java
│           ├── security/                         # Security tests
│           │   ├── JwtTokenProviderTest.java
│           │   └── TenantIsolationTest.java
│           └── TestConfig.java                   # TestContainers config
│
├── pom.xml
├── .env.example
└── Makefile                                      # Common commands
```

---

## 7.4 AI Service Structure (Python FastAPI)

```
ai-service/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI entry point
│   ├── config.py                  # Settings (Pydantic BaseSettings)
│   ├── dependencies.py            # FastAPI dependency injection
│   │
│   ├── api/                       # API routes
│   │   ├── __init__.py
│   │   ├── router.py              # Main router aggregation
│   │   ├── chat.py                # POST /ai/chat
│   │   ├── ocr.py                 # POST /ai/ocr/invoice, /ai/ocr/receipt
│   │   ├── search.py              # POST /ai/search
│   │   ├── analytics.py           # GET /ai/analytics/insights
│   │   ├── forecast.py            # GET /ai/forecast/sales, /ai/forecast/inventory
│   │   └── health.py              # GET /ai/health
│   │
│   ├── agents/                    # LangGraph agent definitions
│   │   ├── __init__.py
│   │   ├── copilot/
│   │   │   ├── __init__.py
│   │   │   ├── graph.py           # Main copilot state machine
│   │   │   ├── state.py           # Agent state definition
│   │   │   ├── nodes.py           # Router, planner, executor nodes
│   │   │   └── edges.py           # Conditional edge functions
│   │   ├── ocr/
│   │   │   ├── __init__.py
│   │   │   ├── invoice_agent.py   # Invoice OCR pipeline
│   │   │   └── receipt_agent.py   # Receipt OCR pipeline
│   │   └── analytics/
│   │       ├── __init__.py
│   │       ├── insight_agent.py   # Automated insight generation
│   │       └── forecast_agent.py  # Sales/inventory forecasting
│   │
│   ├── tools/                     # LangChain tools for agents
│   │   ├── __init__.py
│   │   ├── sql_tool.py            # Execute read-only SQL queries
│   │   ├── api_tool.py            # Call Spring Boot API endpoints
│   │   ├── search_tool.py         # Vector similarity search
│   │   ├── calculator_tool.py     # Financial calculations
│   │   └── date_tool.py           # Date/period resolution
│   │
│   ├── prompts/                   # Versioned prompt templates
│   │   ├── system/
│   │   │   ├── copilot_v1.txt
│   │   │   ├── sql_generator_v1.txt
│   │   │   ├── ocr_invoice_v1.txt
│   │   │   └── ocr_receipt_v1.txt
│   │   ├── tools/
│   │   │   ├── search_customers.txt
│   │   │   ├── query_sales.txt
│   │   │   └── create_invoice.txt
│   │   └── templates/
│   │       ├── insight_weekly.txt
│   │       ├── health_score.txt
│   │       └── forecast.txt
│   │
│   ├── rag/                       # RAG pipeline components
│   │   ├── __init__.py
│   │   ├── embeddings.py          # Embedding model wrapper
│   │   ├── vector_store.py        # pgvector operations
│   │   ├── chunker.py             # Document chunking strategies
│   │   ├── retriever.py           # Retrieval with MMR/reranking
│   │   └── indexer.py             # Background indexing jobs
│   │
│   ├── memory/                    # Conversation memory
│   │   ├── __init__.py
│   │   ├── buffer.py              # In-memory sliding window
│   │   ├── session.py             # PostgreSQL session storage
│   │   └── manager.py             # Memory layer orchestration
│   │
│   ├── ocr/                       # OCR processing
│   │   ├── __init__.py
│   │   ├── preprocessor.py        # Image preprocessing (resize, denoise)
│   │   ├── extractor.py           # Claude Vision structured extraction
│   │   └── validator.py           # Validate extracted data (GSTIN, amounts)
│   │
│   ├── models/                    # Pydantic models
│   │   ├── __init__.py
│   │   ├── chat.py                # ChatRequest, ChatResponse
│   │   ├── ocr.py                 # OcrResult, InvoiceExtraction
│   │   ├── analytics.py           # Insight, Forecast models
│   │   └── common.py              # Shared models
│   │
│   ├── llm/                       # LLM client wrappers
│   │   ├── __init__.py
│   │   ├── provider.py            # Multi-provider router (Claude/OpenAI/Gemini)
│   │   ├── claude.py              # Claude API wrapper
│   │   ├── openai_client.py       # OpenAI API wrapper
│   │   ├── gemini.py              # Gemini API wrapper
│   │   └── token_counter.py       # Token budget management
│   │
│   └── db/                        # Database access
│       ├── __init__.py
│       ├── connection.py          # Async PostgreSQL connection
│       └── queries.py             # Raw SQL queries for AI tools
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py                # Pytest fixtures
│   ├── test_chat.py
│   ├── test_ocr.py
│   ├── test_rag.py
│   ├── test_tools.py
│   └── test_prompts.py            # Prompt regression tests
│
├── pyproject.toml                 # Dependencies (uv/pip)
├── Dockerfile
├── .env.example
└── README.md
```

---

> **Next:** [Chapter 8 — Database Design](./08-database-design.md)
