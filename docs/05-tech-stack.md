# Chapter 5 — Complete Tech Stack

> Back to [Index](./README.md) | Prev ← [AI Features](./04-ai-features.md) | Next → [System Architecture](./06-system-architecture.md)

---

## 5.1 Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                           CLIENT                                │
│  Next.js 14+ │ React 18 │ TypeScript 5 │ Tailwind CSS 3        │
│  shadcn/ui │ React Hook Form │ Zod │ TanStack Query │ Zustand  │
│  Recharts │ Lucide Icons                                        │
├─────────────────────────────────────────────────────────────────┤
│                           GATEWAY                               │
│  Cloudflare (CDN + WAF + DDoS) → Vercel (Frontend)            │
│  Cloudflare → Nginx (Backend Reverse Proxy)                     │
├─────────────────────────────────────────────────────────────────┤
│                       BACKEND API                               │
│  Java 25 │ Spring Boot 3.5 │ Spring Security 6                 │
│  Spring Data JPA │ Hibernate 6 │ Flyway                        │
│  Maven │ MapStruct │ Lombok │ OpenAPI/Springdoc                 │
├─────────────────────────────────────────────────────────────────┤
│                       AI SERVICE                                │
│  Python 3.12 │ FastAPI │ LangGraph │ LangChain                 │
│  Claude API │ OpenAI API │ Gemini API                          │
├─────────────────────────────────────────────────────────────────┤
│                       DATA LAYER                                │
│  Supabase PostgreSQL 15+ │ pgvector │ Redis 7 │ Supabase Storage│
├─────────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE                               │
│  Docker │ Docker Compose │ GitHub Actions │ Prometheus │ Grafana│
│  Sentry │ Resend (Email) │ Firebase Cloud Messaging            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5.2 Frontend Stack

| Technology | Version | Purpose | Rationale |
|-----------|---------|---------|-----------|
| **Next.js** | 14+ (App Router) | Framework | Server Components, file-based routing, API routes, image optimization, SEO |
| **React** | 18+ | UI Library | Component model, hooks, concurrent features, vast ecosystem |
| **TypeScript** | 5+ (strict mode) | Language | Type safety catches bugs at compile time, improves DX, self-documenting |
| **Tailwind CSS** | 3+ | Styling | Utility-first CSS, design system consistency, tiny production bundle |
| **shadcn/ui** | Latest | Component Library | Accessible, customizable, copy-paste (not dependency), built on Radix UI |
| **React Hook Form** | 7+ | Form Management | Minimal re-renders, native validation, uncontrolled components |
| **Zod** | 3+ | Schema Validation | TypeScript-first, schema inference, shared with backend DTOs |
| **TanStack Query** | 5+ | Server State | Caching, background refresh, optimistic updates, pagination |
| **Zustand** | 4+ | Client State | Minimal boilerplate, no Provider wrapping, devtools support |
| **Recharts** | 2+ | Charts | React-native charting, composable, responsive |
| **Lucide Icons** | Latest | Icons | Consistent, tree-shakeable, 1000+ icons |
| **date-fns** | 3+ | Date Utilities | Modular, tree-shakeable, immutable |
| **nuqs** | Latest | URL State | Type-safe URL query state management |
| **next-themes** | Latest | Theme Switching | Dark/light mode with system preference |
| **@tanstack/table** | 8+ | Data Tables | Headless, sortable, filterable, paginated |
| **react-pdf** | Latest | PDF Viewer | View generated invoices in-app |
| **sonner** | Latest | Toasts | Beautiful, stackable toast notifications |
| **cmdk** | Latest | Command Palette | Spotlight-style search (⌘K) |

### Frontend Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Rendering | Server Components (default) + Client Components (interactive) | Performance, SEO, reduced client bundle |
| Data Fetching | TanStack Query (client) + Server Components (initial) | Cache management, background updates |
| Form Strategy | React Hook Form + Zod | Performance (uncontrolled), type-safe validation |
| State Management | Zustand (global UI) + TanStack Query (server) + URL (filters) | Separation of concerns |
| Styling | Tailwind + CSS Variables (design tokens) | Themeable, utility-first |
| Authentication | JWT in memory + httpOnly cookie refresh token | Secure, no localStorage for tokens |

---

## 5.3 Backend Stack

| Technology | Version | Purpose | Rationale |
|-----------|---------|---------|-----------|
| **Java** | 25 (LTS) | Language | Virtual threads (Project Loom), pattern matching, records, sealed classes |
| **Spring Boot** | 3.3+ | Framework | Enterprise-grade, massive ecosystem, auto-configuration, production-ready |
| **Spring Security** | 6+ | Security | JWT validation, RBAC, method-level security, CSRF/CORS |
| **Spring Data JPA** | 3+ | Data Access | Repository pattern, query methods, pagination, specifications |
| **Hibernate** | 6+ | ORM | Entity mapping, lazy loading, batch operations, multi-tenancy support |
| **Flyway** | 10+ | Migrations | Version-controlled database schema, repeatable migrations |
| **Maven** | 3.9+ | Build Tool | Dependency management, multi-module builds, reproducible |
| **MapStruct** | 1.5+ | Object Mapping | Compile-time DTO ↔ Entity mapping, type-safe, zero reflection |
| **Lombok** | 1.18+ | Boilerplate Reduction | `@Data`, `@Builder`, `@Slf4j` — less ceremony |
| **Springdoc OpenAPI** | 2+ | API Documentation | Auto-generated OpenAPI 3.0 spec from annotations |
| **Jackson** | 2.16+ | JSON Processing | Serialization/deserialization, custom serializers |
| **Bean Validation** | 3+ (Hibernate Validator) | Input Validation | Annotation-based validation on DTOs |
| **OpenPDF** | 2+ | PDF Generation | Invoice PDF rendering (iText fork, LGPL-friendly) |
| **JavaMail** | 2+ | Email | SMTP integration via Resend |
| **Caffeine** | 3+ | Local Cache | In-process caching for hot data (tax rates, settings) |

### Backend Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Architecture | Layered (Controller → Service → Repository) | Clear separation, testable, standard Spring |
| Persistence | JPA + Hibernate (not raw SQL) | Productivity, portability, type safety |
| DTO Pattern | Separate Request/Response DTOs, never expose entities | API contract stability, security (no lazy-loading in response) |
| Mapping | MapStruct (not manual, not ModelMapper) | Compile-time, type-safe, fastest |
| Validation | Bean Validation on DTOs + custom validators | Declarative, consistent error format |
| Multi-tenancy | Shared DB + discriminator column (`organization_id`) | Simplicity for MVP, migrate to schema-per-tenant if needed |
| Exception Handling | Global `@ControllerAdvice` | Consistent error responses |
| Logging | SLF4J + Logback, structured JSON in production | Searchable, parseable by monitoring tools |
| Testing | JUnit 5 + Mockito + TestContainers | Unit + integration with real database |

---

## 5.4 AI Service Stack

| Technology | Version | Purpose | Rationale |
|-----------|---------|---------|-----------|
| **Python** | 3.12+ | Language | AI/ML ecosystem, LangChain/LangGraph native |
| **FastAPI** | 0.110+ | Web Framework | Async, auto-docs, Pydantic validation, fast |
| **LangGraph** | 0.2+ | Agent Orchestration | State machine for multi-step AI workflows, conditional routing |
| **LangChain** | 0.3+ | LLM Framework | Chains, retrievers, embeddings, memory, tool calling |
| **Claude API** | Anthropic SDK | Primary LLM | Best reasoning, long context, vision capabilities |
| **OpenAI API** | openai SDK | Fallback LLM | GPT-4 fallback, embeddings (`text-embedding-3-small`) |
| **Gemini API** | google-genai SDK | Alternative LLM | Cost-effective for high-volume, low-complexity tasks |
| **Pydantic** | 2+ | Data Validation | Structured output parsing, type safety |
| **psycopg** | 3+ | PostgreSQL Driver | Async PostgreSQL access |
| **httpx** | 0.27+ | HTTP Client | Async HTTP for Spring Boot API calls |
| **Pillow** | 10+ | Image Processing | OCR preprocessing |
| **python-multipart** | Latest | File Upload | Handling image/PDF uploads |
| **tiktoken** | Latest | Token Counting | Budget and optimize context windows |
| **Tenacity** | 8+ | Retry Logic | Exponential backoff for LLM API calls |

### AI Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| LLM Strategy | Multi-model (Claude primary, OpenAI fallback, Gemini budget) | Resilience, cost optimization, best-model-per-task |
| Agent Framework | LangGraph (not LangChain agents) | Explicit state machine, deterministic routing, debuggable |
| Embedding Storage | pgvector (not Pinecone/Weaviate) | Co-located with business data, no extra service, Supabase native |
| OCR Strategy | Claude Vision (not Tesseract) | Superior accuracy for Indian invoices, structured extraction |
| Memory | PostgreSQL (session) + pgvector (knowledge) | Single data store, tenant-isolated |
| Prompt Management | Versioned templates in `/prompts` directory | Version-controlled, A/B testable, auditable |

---

## 5.5 Database

| Technology | Version | Purpose | Rationale |
|-----------|---------|---------|-----------|
| **Supabase PostgreSQL** | 15+ | Primary Database | Managed, real-time subscriptions, Row-Level Security, pgvector |
| **pgvector** | 0.7+ | Vector Store | Embedding storage for RAG, co-located with business data |
| **PostGIS** | 3+ | Geospatial (future) | Store/query geographic data (branch locations, delivery zones) |

### Why Supabase?

| Benefit | Detail |
|---------|--------|
| Managed PostgreSQL | No DBA needed, automated backups, point-in-time recovery |
| Built-in Auth | Can supplement JWT with Supabase Auth if needed (future) |
| Row-Level Security | Additional tenant isolation layer at database level |
| Realtime | WebSocket subscriptions for live dashboard updates |
| Storage | S3-compatible file storage for invoices, receipts, logos |
| pgvector | Native vector extension for AI embeddings |
| Edge Functions | Serverless functions for webhooks, cron (future) |
| Dashboard | Web UI for database management |
| Free Tier | Generous free tier for development and small deployments |

---

## 5.6 Storage

| Service | Use Case | Limits |
|---------|----------|--------|
| **Supabase Storage** | Invoice PDFs, receipt images, product images, logos, document uploads | Configurable per bucket |
| **Bucket: `invoices`** | Generated invoice PDFs | Max 10 MB per file |
| **Bucket: `receipts`** | Uploaded receipt images for OCR | Max 10 MB per file |
| **Bucket: `products`** | Product images | Max 2 MB per file, 5 per product |
| **Bucket: `logos`** | Organization logos | Max 2 MB per file |
| **Bucket: `documents`** | General business documents | Max 25 MB per file |

### Storage Policies

- Files organized by: `/{bucket}/{organization_id}/{entity_type}/{entity_id}/{filename}`
- Access controlled by Supabase RLS policies (organization-scoped)
- CDN delivery via Supabase built-in CDN
- Signed URLs for private files (1-hour expiry)

---

## 5.7 Cache

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Redis** | 7+ | Server-side caching, session storage, rate limiting |

### Cache Strategy

| Data | Cache Location | TTL | Invalidation |
|------|---------------|-----|-------------|
| Tax rates & HSN codes | Redis + Caffeine (local) | 24 hours | Manual refresh on settings change |
| Organization settings | Caffeine (local) | 5 minutes | Event-driven invalidation |
| Dashboard aggregates | Redis | 5 minutes | Background refresh |
| User sessions | Redis | 7 days | Explicit logout/expiry |
| Rate limit counters | Redis | 1 minute sliding window | Auto-expire |
| API response cache | Redis | Varies by endpoint | Cache-aside pattern |
| Product catalog | Redis | 15 minutes | Invalidate on product CRUD |

---

## 5.8 Queue (Future)

| Technology | Version | Purpose | Phase |
|-----------|---------|---------|-------|
| **RabbitMQ** | 3.12+ | Async task processing | P2 |

### Planned Use Cases

| Queue | Purpose |
|-------|---------|
| `invoice.pdf.generate` | Async PDF generation for bulk invoices |
| `notification.email` | Email delivery queue |
| `notification.push` | Push notification queue |
| `ai.ocr.process` | OCR processing queue |
| `report.generate` | Heavy report generation |
| `audit.log` | Async audit log writing |

---

## 5.9 Notifications

| Service | Purpose | Phase |
|---------|---------|-------|
| **Resend** | Transactional email (verification, invoices, reports, alerts) | MVP |
| **Firebase Cloud Messaging** | Push notifications (web + mobile) | P2 |
| **WhatsApp Business API** | Invoice sharing, payment reminders | P4 |

---

## 5.10 Monitoring & Observability

| Technology | Purpose | Phase |
|-----------|---------|-------|
| **Sentry** | Error tracking, performance monitoring (frontend + backend) | MVP |
| **Prometheus** | Metrics collection (JVM, API latency, DB, custom business metrics) | MVP |
| **Grafana** | Dashboards and alerting on Prometheus metrics | MVP |
| **Structured Logging** | JSON logs with correlation IDs (Logback → centralized logging) | MVP |
| **Spring Boot Actuator** | Health checks, metrics endpoints, info | MVP |

### Key Metrics to Monitor

| Metric | Type | Alert Threshold |
|--------|------|----------------|
| API response time (p95) | Histogram | > 500ms |
| API error rate (5xx) | Counter | > 1% |
| Database query time (p95) | Histogram | > 200ms |
| Database connection pool usage | Gauge | > 80% |
| JVM heap usage | Gauge | > 85% |
| Redis memory usage | Gauge | > 80% |
| Active sessions | Gauge | Informational |
| Invoice generation rate | Counter | Informational |
| AI API latency | Histogram | > 5s |
| AI API error rate | Counter | > 5% |

---

## 5.11 DevOps & Infrastructure

| Technology | Purpose |
|-----------|---------|
| **Docker** | Containerize all services (backend, AI, Redis) |
| **Docker Compose** | Local development environment (all services in one command) |
| **GitHub Actions** | CI/CD pipelines (build, test, lint, deploy) |
| **Nginx** | Reverse proxy, SSL termination, static file serving |
| **Cloudflare** | CDN, DDoS protection, WAF, DNS management |
| **Vercel** | Frontend hosting (Next.js optimized) |
| **Railway / Render** | Backend hosting (Docker containers) |

---

## 5.12 Version Compatibility Matrix

| Component | Minimum Version | Recommended Version |
|-----------|----------------|-------------------|
| Node.js | 18 LTS | 20 LTS |
| Java | 21 | 21 |
| Python | 3.11 | 3.12 |
| PostgreSQL | 15 | 16 |
| Redis | 7.0 | 7.2 |
| Docker | 24 | 25 |
| Docker Compose | 2.20 | 2.29 |
| Maven | 3.9 | 3.9.6 |
| npm | 9 | 10 |

---

> **Next:** [Chapter 6 — System Architecture](./06-system-architecture.md)
