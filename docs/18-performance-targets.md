# Chapter 18 — Performance Targets (SLAs)

> Back to [Index](./README.md) | Prev ← [Coding Standards](./17-coding-standards.md)

---

## 18.1 Service Level Agreements

### API Performance

| Metric | Target | Measurement | Alert Threshold |
|--------|--------|-------------|----------------|
| **Dashboard Load** | < 2 seconds | Lighthouse / RUM | > 3 seconds |
| **API Response (p50)** | < 100 ms | Prometheus histogram | > 200 ms |
| **API Response (p95)** | < 300 ms | Prometheus histogram | > 500 ms |
| **API Response (p99)** | < 1 second | Prometheus histogram | > 1.5 seconds |
| **Invoice PDF Generation** | < 5 seconds | Server timing | > 8 seconds |
| **AI Chat First Token** | < 3 seconds | Client timing | > 5 seconds |
| **AI Chat Full Response** | < 15 seconds | Client timing | > 20 seconds |
| **OCR Processing** | < 10 seconds | Server timing | > 15 seconds |
| **File Upload (10MB)** | < 5 seconds | Client timing | > 10 seconds |
| **Search Results** | < 500 ms | API response time | > 1 second |
| **Report Generation** | < 10 seconds (standard) | Server timing | > 15 seconds |
| **Report Export (Excel)** | < 30 seconds (< 10K rows) | Server timing | > 45 seconds |

### Database Performance

| Metric | Target | Measurement | Alert Threshold |
|--------|--------|-------------|----------------|
| **Indexed Lookup** | < 100 ms | Query execution plan | > 200 ms |
| **Complex Join (reporting)** | < 500 ms | Query execution plan | > 1 second |
| **Full-text Search** | < 200 ms | Query execution plan | > 500 ms |
| **Write (single row)** | < 50 ms | Query execution plan | > 100 ms |
| **Batch Write (50 rows)** | < 500 ms | Query execution plan | > 1 second |
| **Connection Pool Utilization** | < 80% | HikariCP metrics | > 80% |
| **Active Connections** | < 15 (of 20 pool) | HikariCP metrics | > 15 |

### Availability

| Metric | Target | Measurement | Consequence |
|--------|--------|-------------|-------------|
| **Monthly Uptime** | 99.9% | External monitoring | ≤ 43 min downtime/month |
| **RTO (Recovery Time)** | < 1 hour | Disaster recovery drill | Post-mortem if exceeded |
| **RPO (Recovery Point)** | < 15 minutes | Backup verification | Data loss investigation |
| **Planned Maintenance** | < 30 min/month | Scheduled windows | Pre-announced 48h |
| **Deployment Downtime** | Zero (rolling) | Deployment metrics | Required for all deploys |

---

## 18.2 Frontend Performance Budgets

### Core Web Vitals

| Metric | Target | Measurement |
|--------|--------|-------------|
| **LCP** (Largest Contentful Paint) | < 2.5 seconds | Lighthouse / CrUX |
| **FID** (First Input Delay) | < 100 ms | Lighthouse / CrUX |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Lighthouse / CrUX |
| **FCP** (First Contentful Paint) | < 1.8 seconds | Lighthouse |
| **TTFB** (Time to First Byte) | < 800 ms | Lighthouse |
| **INP** (Interaction to Next Paint) | < 200 ms | CrUX |

### Bundle Size Budgets

| Bundle | Max Size (gzipped) |
|--------|-------------------|
| Initial JS (First Load) | < 150 KB |
| Per-route JS | < 50 KB |
| Total CSS | < 30 KB |
| Critical CSS | < 14 KB (inlined) |
| Images (per page) | < 500 KB total |
| Fonts | < 100 KB (2 weights of Inter + 1 weight JetBrains Mono) |

### Lighthouse Scores

| Category | Target |
|----------|--------|
| Performance | ≥ 90 |
| Accessibility | ≥ 90 |
| Best Practices | ≥ 95 |
| SEO | ≥ 90 |
| PWA | ≥ 60 (Phase 4: ≥ 90) |

---

## 18.3 Scalability Targets

### Concurrent Load

| Metric | Target | Test Method |
|--------|--------|------------|
| Concurrent users per org | ≥ 50 | k6 load test |
| Concurrent API requests (platform) | ≥ 10,000/min | k6 stress test |
| WebSocket connections (dashboard, future) | ≥ 1,000 | k6 WebSocket test |

### Data Volume

| Metric | Target | Validation |
|--------|--------|-----------|
| Organizations (tenants) | 10,000+ | Benchmark with synthetic data |
| Products per organization | 100,000+ | Query performance test |
| Invoices per org per year | 500,000+ | Pagination + search performance |
| Total database size | 500 GB+ | Before considering partitioning |
| Audit log entries | 100M+ | With date-range partitioning |
| Vector embeddings (AI) | 10M+ | pgvector IVFFlat → HNSW migration |

---

## 18.4 Resource Utilization Targets

### Backend (Spring Boot)

| Resource | Normal | Alert | Critical |
|----------|--------|-------|----------|
| CPU Usage | < 50% | > 70% | > 90% |
| Heap Memory | < 60% | > 75% | > 85% |
| Non-Heap Memory | < 80% | > 90% | > 95% |
| GC Pause Time | < 100ms | > 200ms | > 500ms |
| Thread Count | < 200 | > 300 | > 500 |

### Database (PostgreSQL)

| Resource | Normal | Alert | Critical |
|----------|--------|-------|----------|
| CPU | < 40% | > 60% | > 80% |
| Memory | < 70% | > 80% | > 90% |
| Storage | < 60% | > 75% | > 85% |
| Connections | < 60% of max | > 80% | > 90% |
| Replication Lag | < 1 second | > 5 seconds | > 30 seconds |

### Redis

| Resource | Normal | Alert | Critical |
|----------|--------|-------|----------|
| Memory | < 60% | > 75% | > 85% |
| Hit Rate | > 90% | < 80% | < 70% |
| Connected Clients | < 100 | > 200 | > 500 |
| Evictions | 0 | > 0 | Sustained > 0 |

---

## 18.5 Performance Optimization Checklist

### Database

- [ ] All frequently-queried columns indexed
- [ ] Composite indexes for multi-column WHERE clauses
- [ ] Partial indexes for filtered queries (e.g., `WHERE deleted_at IS NULL`)
- [ ] GIN trigram indexes for text search
- [ ] `EXPLAIN ANALYZE` run for all report queries
- [ ] N+1 queries detected and fixed (Hibernate batch fetching)
- [ ] Connection pool sized correctly (HikariCP)
- [ ] Slow query logging enabled (> 200ms threshold)
- [ ] Vacuum and analyze schedules configured

### API

- [ ] Pagination on all list endpoints
- [ ] Projection/sparse fields for list views (no unnecessary data)
- [ ] Redis caching for frequently-read, rarely-changed data
- [ ] Gzip compression for response bodies > 1KB
- [ ] Async processing for non-blocking operations (PDF generation, email)
- [ ] Batch operations for bulk data (saveAll, insertAll)
- [ ] ETag headers for conditional requests (future)

### Frontend

- [ ] Server Components for static/fetch-heavy pages
- [ ] Dynamic imports for feature pages
- [ ] Image optimization via `next/image`
- [ ] Font subsetting and preloading
- [ ] Skeleton loaders for perceived performance
- [ ] TanStack Query prefetching for anticipated navigation
- [ ] Virtual scrolling for long lists (> 100 items)
- [ ] Debounced search inputs (300ms)
- [ ] Memoized expensive computations
- [ ] Service Worker for static asset caching (Phase 4)

### AI

- [ ] Token counting before API calls (prevent context overflow)
- [ ] Response streaming (SSE) for chat
- [ ] Caching of embeddings for unchanged entities
- [ ] Batch embedding generation (not one-by-one)
- [ ] Model selection based on task complexity (Gemini for simple, Claude for complex)
- [ ] Prompt optimization (minimal tokens for same quality)
- [ ] Connection pooling for LLM APIs
- [ ] Circuit breaker for LLM API failures

---

## 18.6 Monitoring & SLA Verification

### How We Measure

| Metric | Tool | Frequency |
|--------|------|-----------|
| API latency | Prometheus + Grafana | Real-time (15s scrape) |
| Error rate | Prometheus + Sentry | Real-time |
| Database performance | PostgreSQL slow query log + pg_stat_statements | Continuous |
| Frontend performance | Lighthouse CI + Web Vitals RUM | Per deploy + continuous |
| Uptime | External ping (UptimeRobot / BetterStack) | 1-minute interval |
| Load testing | k6 | Pre-release (staging) |
| Bundle size | `@next/bundle-analyzer` + CI check | Every PR |

### SLA Reporting

- Monthly SLA report generated automatically
- Published to internal dashboard
- Incidents documented with post-mortems
- Performance trends tracked month-over-month

---

## 18.7 Performance Testing Schedule

| Test Type | Frequency | Environment | Duration |
|-----------|-----------|-------------|----------|
| **Smoke Test** | Every deploy | Staging | 1 min |
| **Load Test** | Weekly | Staging | 10 min |
| **Stress Test** | Pre-release | Staging | 5 min |
| **Soak Test** | Monthly | Staging | 2 hours |
| **Benchmark (DB)** | After migration | Staging | Per query |
| **Lighthouse CI** | Every PR | Preview | Automatic |

---

*End of Document*

---

> Back to [Index](./README.md)

---

**Document Statistics:**
- **Chapters:** 18
- **Total estimated pages:** ~150 (rendered)
- **Tables:** 120+
- **Code examples:** 50+
- **Diagrams:** 20+
- **Last updated:** 2026-07-10
- **Version:** 1.0.0
