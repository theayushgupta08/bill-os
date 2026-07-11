# Chapter 14 — CI/CD

> Back to [Index](./README.md) | Prev ← [Testing Strategy](./13-testing-strategy.md) | Next → [Deployment Guide](./15-deployment-guide.md)

---

## 14.1 Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CI/CD Pipeline Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────┐    ┌──────────┐    ┌────────┐    ┌──────────────┐    │
│  │ Push │───▶│   CI     │───▶│ Build  │───▶│   Deploy     │    │
│  │ / PR │    │ (test)   │    │ (image)│    │ (staging/    │    │
│  └──────┘    └──────────┘    └────────┘    │  production) │    │
│                                            └──────────────┘    │
│                                                                 │
│  Triggers:                                                      │
│  • PR to develop → CI only (test + lint)                       │
│  • Merge to develop → CI + Deploy to Staging                   │
│  • Tag v*.*.* → CI + Deploy to Production                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 14.2 GitHub Actions Workflows

### CI Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  pull_request:
    branches: [develop, main]
  push:
    branches: [develop]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ─── Frontend ───────────────────────────────────
  frontend-ci:
    name: Frontend CI
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type Check
        run: npm run type-check

      - name: Unit Tests
        run: npm run test -- --coverage

      - name: Build
        run: npm run build

      - name: Upload Coverage
        uses: actions/upload-artifact@v4
        with:
          name: frontend-coverage
          path: frontend/coverage/

  # ─── Backend ────────────────────────────────────
  backend-ci:
    name: Backend CI
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: billos_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        ports: ['6379:6379']
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: 21
          distribution: temurin
          cache: maven

      - name: Build & Test
        run: ./mvnw verify -B
        env:
          SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/billos_test
          SPRING_DATASOURCE_USERNAME: test
          SPRING_DATASOURCE_PASSWORD: test
          SPRING_REDIS_HOST: localhost
          SPRING_REDIS_PORT: 6379

      - name: Upload Coverage (JaCoCo)
        uses: actions/upload-artifact@v4
        with:
          name: backend-coverage
          path: backend/target/site/jacoco/

  # ─── AI Service ─────────────────────────────────
  ai-service-ci:
    name: AI Service CI
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ai-service
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: |
          pip install uv
          uv pip install -e ".[dev]" --system

      - name: Lint
        run: ruff check .

      - name: Type Check
        run: mypy app/

      - name: Unit Tests
        run: pytest tests/ -v --tb=short
```

---

### Deploy Staging (`.github/workflows/deploy-staging.yml`)

```yaml
name: Deploy Staging

on:
  push:
    branches: [develop]

jobs:
  deploy-backend-staging:
    name: Deploy Backend to Staging
    runs-on: ubuntu-latest
    needs: [backend-ci]  # from ci.yml (reuse)
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker Image
        run: |
          docker build -t billos-backend:staging \
            -f docker/backend/Dockerfile ./backend

      - name: Push to Registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker tag billos-backend:staging ${{ secrets.REGISTRY }}/billos-backend:staging
          docker push ${{ secrets.REGISTRY }}/billos-backend:staging

      - name: Deploy to Staging
        run: |
          # Railway/Render deployment via CLI or API
          curl -X POST "${{ secrets.STAGING_DEPLOY_WEBHOOK }}"

  deploy-frontend-staging:
    name: Deploy Frontend to Staging
    runs-on: ubuntu-latest
    needs: [frontend-ci]
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel (staging)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          # No --prod flag = preview deployment
```

---

### Deploy Production (`.github/workflows/deploy-production.yml`)

```yaml
name: Deploy Production

on:
  push:
    tags: ['v*.*.*']

jobs:
  deploy-backend-production:
    name: Deploy Backend to Production
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Extract version from tag
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Build Docker Image
        run: |
          docker build -t billos-backend:${{ steps.version.outputs.VERSION }} \
            -f docker/backend/Dockerfile ./backend

      - name: Push to Registry
        run: |
          docker tag billos-backend:${{ steps.version.outputs.VERSION }} \
            ${{ secrets.REGISTRY }}/billos-backend:${{ steps.version.outputs.VERSION }}
          docker push ${{ secrets.REGISTRY }}/billos-backend:${{ steps.version.outputs.VERSION }}
          # Also tag as 'latest'
          docker tag billos-backend:${{ steps.version.outputs.VERSION }} \
            ${{ secrets.REGISTRY }}/billos-backend:latest
          docker push ${{ secrets.REGISTRY }}/billos-backend:latest

      - name: Deploy to Production
        run: curl -X POST "${{ secrets.PRODUCTION_DEPLOY_WEBHOOK }}"

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          generate_release_notes: true

  deploy-frontend-production:
    name: Deploy Frontend to Production
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel (production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: --prod
```

---

## 14.3 Pipeline Stages Summary

| Stage | Actions | Fail Behavior |
|-------|---------|---------------|
| **Lint** | ESLint (frontend), Ruff (AI), Checkstyle (backend) | Block merge |
| **Type Check** | `tsc --noEmit` (frontend), `mypy` (AI) | Block merge |
| **Unit Tests** | Vitest (frontend), JUnit (backend), Pytest (AI) | Block merge |
| **Integration Tests** | TestContainers (backend) | Block merge |
| **Build** | `npm run build`, `mvn package`, Docker build | Block merge |
| **Security Scan** | Dependabot, Trivy (containers) | Warn (non-blocking for low severity) |
| **Deploy Staging** | Auto on merge to `develop` | Alert team |
| **Deploy Production** | Manual tag `v*.*.*` | Require approval |

---

## 14.4 Rollback Strategy

| Scenario | Action |
|----------|--------|
| **Frontend rollback** | Vercel instant rollback to previous deployment |
| **Backend rollback** | Re-deploy previous Docker image tag |
| **Database rollback** | Flyway does NOT auto-rollback. Write a forward migration to undo changes. |
| **Hotfix** | Branch from `main`, fix, merge to `main` AND `develop` |

---

> **Next:** [Chapter 15 — Deployment Guide](./15-deployment-guide.md)
