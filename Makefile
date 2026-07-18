.PHONY: review build-graph check-architecture check-dead-code status

review: build-graph check-architecture check-dead-code status
	@echo "Code review complete."

build-graph:
	@echo "Building code-review-graph..."
	@code-review-graph build

check-architecture:
	@echo "Checking architecture..."
	@code-review-graph architecture

check-dead-code:
	@echo "Checking for dead code..."
	@code-review-graph dead-code --limit 10

status:
	@echo "Graph status:"
	@code-review-graph status

# ==========================================
# Backend (Spring Boot) Commands
# ==========================================
.PHONY: backend-build backend-clean backend-run backend-test backend-format

backend-build:
	cd backend && mvnw.cmd clean install -DskipTests

backend-clean:
	cd backend && mvnw.cmd clean

backend-run:
	cd backend && mvnw.cmd spring-boot:run

backend-test:
	cd backend && mvnw.cmd test

backend-format:
	cd backend && mvnw.cmd spotless:apply

# ==========================================
# Frontend (Next.js) Commands
# ==========================================
.PHONY: frontend-install frontend-build frontend-clean frontend-run frontend-lint frontend-format

frontend-install:
	cd frontend && pnpm install

frontend-build:
	cd frontend && pnpm build

frontend-clean:
	cmd /c "if exist frontend\.next rmdir /s /q frontend\.next"
	cmd /c "if exist frontend\node_modules rmdir /s /q frontend\node_modules"

frontend-run:
	cd frontend && pnpm dev

frontend-lint:
	cd frontend && pnpm lint

frontend-format:
	cd frontend && pnpm lint --fix

# ==========================================
# AI Service (FastAPI) Commands
# ==========================================
.PHONY: ai-install ai-clean ai-run ai-test ai-lint ai-format

ai-install:
	cd ai-service && cmd /c "if not exist venv python -m venv venv"
	cd ai-service && venv\Scripts\pip install -e .[dev]

ai-clean:
	cmd /c "if exist ai-service\__pycache__ rmdir /s /q ai-service\__pycache__"
	cmd /c "if exist ai-service\.pytest_cache rmdir /s /q ai-service\.pytest_cache"
	cmd /c "if exist ai-service\venv rmdir /s /q ai-service\venv"

ai-run:
	cd ai-service && venv\Scripts\uvicorn app.main:app --reload

ai-test:
	cd ai-service && venv\Scripts\pytest

ai-lint:
	cd ai-service && venv\Scripts\ruff check . && venv\Scripts\mypy .

ai-format:
	cd ai-service && venv\Scripts\ruff format .

# ==========================================
# Global Commands
# ==========================================
.PHONY: install build clean test run format

install: frontend-install ai-install
	cd backend && mvnw.cmd dependency:resolve

build: backend-build frontend-build

clean: backend-clean frontend-clean ai-clean

test: backend-test ai-test

format: backend-format frontend-format ai-format

run:
	cmd /c start "Backend" cmd /k "cd backend && .\mvnw.cmd spring-boot:run"
	cmd /c start "Frontend" cmd /k "cd frontend && pnpm dev"
	cmd /c start "AI Service" cmd /k "cd ai-service && .\venv\Scripts\uvicorn app.main:app --reload"
