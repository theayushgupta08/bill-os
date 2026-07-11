# Chapter 15 — Deployment Guide

> Back to [Index](./README.md) | Prev ← [CI/CD](./14-ci-cd.md) | Next → [Roadmap](./16-roadmap.md)

---

## 15.1 Environment Matrix

| | Development | Staging | Production |
|---|-----------|---------|------------|
| **Frontend** | `localhost:3000` | `staging.billos.app` | `billos.app` |
| **Backend** | `localhost:8080` | `staging-api.billos.app` | `api.billos.app` |
| **AI Service** | `localhost:8000` | `staging-ai.billos.app` | `ai.billos.app` |
| **Database** | Docker PostgreSQL | Supabase (staging project) | Supabase (production project) |
| **Redis** | Docker Redis | Railway Redis | Railway Redis |
| **CDN** | — | Cloudflare | Cloudflare |
| **Monitoring** | Docker Prometheus + Grafana | Grafana Cloud | Grafana Cloud |
| **Error Tracking** | Console | Sentry (staging DSN) | Sentry (production DSN) |

---

## 15.2 Local Development Setup

### Prerequisites

| Tool | Version | Installation |
|------|---------|-------------|
| Node.js | 20 LTS | `nvm install 20` |
| Java | 21 | `sdkman install java 21-tem` |
| Python | 3.12 | `pyenv install 3.12` |
| Docker | 25+ | Docker Desktop |
| Maven | 3.9+ | Bundled with backend (`mvnw`) |
| Git | 2.40+ | System install |

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/shrialok-ai-labs/billos.git
cd billos

# Start infrastructure (Postgres, Redis, Prometheus, Grafana)
docker compose up -d

# Backend
cd backend
cp .env.example .env
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Frontend (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev

# AI Service (new terminal)
cd ai-service
cp .env.example .env
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

### Docker Compose (Local Dev)

```yaml
# docker/docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:16
    ports:
      - '5432:5432'
    environment:
      POSTGRES_DB: billos_dev
      POSTGRES_USER: billos
      POSTGRES_PASSWORD: billos_dev_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ../scripts/seed-data.sql:/docker-entrypoint-initdb.d/seed.sql
    healthcheck:
      test: pg_isready -U billos
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    healthcheck:
      test: redis-cli ping
      interval: 10s
      timeout: 5s
      retries: 5

  prometheus:
    image: prom/prometheus:latest
    ports:
      - '9090:9090'
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - '3001:3000'
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  postgres_data:
  grafana_data:
```

---

## 15.3 Staging Deployment

### Architecture

```
Developer merges PR to develop
    ↓
GitHub Actions CI pipeline runs
    ↓
Tests pass → auto-deploy to staging
    ↓
Frontend → Vercel (preview deployment)
Backend → Railway (staging service)
AI Service → Railway (staging service)
Database → Supabase (staging project)
```

### Environment Variables (Staging)

```bash
# Backend (Railway staging)
SPRING_PROFILES_ACTIVE=staging
SPRING_DATASOURCE_URL=jdbc:postgresql://[supabase-staging-host]:5432/postgres
SPRING_DATASOURCE_USERNAME=[staging-user]
SPRING_DATASOURCE_PASSWORD=[staging-password]
SPRING_REDIS_HOST=[railway-redis-host]
JWT_PRIVATE_KEY=[staging-private-key]
RESEND_API_KEY=[staging-resend-key]
SUPABASE_URL=[staging-supabase-url]
SUPABASE_SERVICE_KEY=[staging-supabase-key]
SENTRY_DSN=[staging-sentry-dsn]
AI_SERVICE_URL=https://staging-ai.billos.app

# Frontend (Vercel staging)
NEXT_PUBLIC_API_URL=https://staging-api.billos.app/api/v1
NEXT_PUBLIC_SENTRY_DSN=[staging-sentry-dsn]
NEXT_PUBLIC_ENV=staging
```

---

## 15.4 Production Deployment

### Architecture

```
Developer creates tag: git tag v1.0.0 && git push --tags
    ↓
GitHub Actions production pipeline runs
    ↓
Tests pass → build Docker images → push to registry
    ↓
Manual approval gate (environment protection rule)
    ↓
Frontend → Vercel (production deployment)
Backend → Railway (production service)
AI Service → Railway (production service)
Database → Supabase (production project, Mumbai region)
CDN → Cloudflare (caching + WAF)
```

### Production Checklist

- [ ] All tests passing on `main` branch
- [ ] Database migrations reviewed and tested on staging
- [ ] Environment variables set in production hosting
- [ ] SSL certificates valid (Cloudflare managed)
- [ ] DNS records configured for all domains
- [ ] Monitoring dashboards active (Grafana)
- [ ] Error tracking active (Sentry)
- [ ] Backup schedule confirmed (Supabase)
- [ ] Rate limiting configured
- [ ] Security headers verified
- [ ] Load testing completed on staging
- [ ] Rollback plan documented

---

## 15.5 Domain & DNS

| Domain | Record Type | Value | Purpose |
|--------|------------|-------|---------|
| `billos.app` | A | Vercel IP | Frontend |
| `www.billos.app` | CNAME | `billos.app` | www redirect |
| `api.billos.app` | CNAME | Railway hostname | Backend API |
| `ai.billos.app` | CNAME | Railway hostname | AI service |
| `staging.billos.app` | CNAME | Vercel preview | Staging frontend |
| `staging-api.billos.app` | CNAME | Railway hostname | Staging backend |

**DNS Provider:** Cloudflare (proxy enabled for DDoS protection)

---

## 15.6 SSL / TLS

| Component | SSL Method |
|-----------|-----------|
| **Frontend** | Vercel automatic SSL (Let's Encrypt) |
| **Backend** | Cloudflare Full (Strict) mode — Cloudflare ↔ origin encrypted |
| **Database** | Supabase enforces SSL connections |
| **Redis** | TLS enabled on Railway managed Redis |
| **Inter-service** | HTTPS between backend and AI service |

---

## 15.7 Monitoring

### Health Check Endpoints

| Service | Endpoint | Expected |
|---------|----------|----------|
| Backend | `GET /actuator/health` | `{"status": "UP"}` |
| AI Service | `GET /ai/health` | `{"status": "healthy"}` |
| Frontend | `GET /api/health` (Next.js API route) | `200 OK` |

### Prometheus Metrics

| Metric | Type | Source |
|--------|------|--------|
| `http_server_requests_seconds` | Histogram | Spring Boot Actuator |
| `jvm_memory_used_bytes` | Gauge | Spring Boot Actuator |
| `hikaricp_connections_active` | Gauge | HikariCP |
| `billos_invoices_created_total` | Counter | Custom business metric |
| `billos_payments_received_total` | Counter | Custom business metric |
| `billos_api_errors_total` | Counter | Custom error metric |

### Grafana Dashboards

| Dashboard | Panels |
|-----------|--------|
| **API Health** | Request rate, error rate, latency (p50/p95/p99), status code distribution |
| **JVM** | Heap usage, GC pauses, thread count, CPU usage |
| **Database** | Connection pool usage, query latency, active transactions |
| **Business** | Invoices created/day, payments/day, active users, new registrations |
| **AI Service** | Request rate, LLM latency, token usage, error rate |

### Alerting

| Alert | Condition | Channel |
|-------|-----------|---------|
| API Error Rate > 1% | 5xx / total > 0.01 for 5 min | Slack + Email |
| API Latency p95 > 500ms | For 10 minutes | Slack |
| DB Connection Pool > 80% | For 5 minutes | Slack + PagerDuty |
| JVM Heap > 85% | For 10 minutes | Slack |
| Disk Usage > 80% | Any volume | Email |
| Certificate Expiry < 14 days | Daily check | Email |
| Service Down | Health check fails 3 consecutive times | Slack + PagerDuty + Email |

---

## 15.8 Backups

### Database Backups (Supabase Managed)

| Type | Frequency | Retention |
|------|-----------|-----------|
| Point-in-Time Recovery (PITR) | Continuous (WAL archiving) | 7 days (Pro) / 30 days (Team) |
| Daily Snapshots | Every 24 hours | 30 days |
| Manual Backups | On-demand before major deployments | Indefinite |

### Storage Backups

| Data | Strategy | Retention |
|------|----------|-----------|
| Invoice PDFs | Supabase Storage (S3-compatible, durable) | Indefinite |
| Receipt Images | Supabase Storage | 7 years (tax compliance) |
| E-Invoice JSON (IRP) | Database JSONB column + storage backup | 6 years (mandatory) |

---

## 15.9 Disaster Recovery

| Scenario | RTO | RPO | Recovery Action |
|----------|-----|-----|----------------|
| **Frontend outage** | < 5 min | 0 | Vercel automatic failover / redeploy |
| **Backend outage** | < 15 min | 0 | Railway auto-restart / redeploy previous image |
| **Database corruption** | < 1 hour | < 15 min | Supabase PITR to point before corruption |
| **Full region outage** | < 4 hours | < 1 hour | Restore from backup to new Supabase project |
| **Security breach** | < 1 hour | — | Rotate all secrets, revoke all sessions, audit logs |
| **Data loss (user error)** | < 30 min | 0 | Soft deletes → restore via admin API. PITR for physical. |

---

> **Next:** [Chapter 16 — Roadmap](./16-roadmap.md)
