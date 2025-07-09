.PHONY: help dev build up down logs clean test

# Default target
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development
dev: ## Start development environment
	docker compose -f docker/compose.dev.yml up

dev-detached: ## Start development environment in detached mode
	docker compose -f docker/compose.dev.yml up --build -d

dev-down: ## Stop development environment
	docker compose -f docker/compose.dev.yml down

dev-logs: ## Show development logs
	docker compose -f docker/compose.dev.yml logs -f

# Production
build: ## Build all services
	docker compose -f docker/compose.yml build

up: ## Start production environment
	docker compose -f docker/compose.yml up --build

up-detached: ## Start production environment in detached mode
	docker compose -f docker/compose.yml up --build -d

down: ## Stop production environment
	docker compose -f docker/compose.yml down

restart: ## Restart all services
	docker compose -f docker/compose.yml restart

logs: ## Show production logs
	docker compose -f docker/compose.yml logs -f

# Backend
backend-shell: ## Connect to backend container shell
	docker compose -f docker/compose.yml exec backend sh

backend-logs: ## Show backend logs
	docker compose -f docker/compose.yml logs -f backend

backend-test: ## Run backend tests
	cd backend && go test ./...

# Frontend
frontend-shell: ## Connect to frontend container shell
	docker compose -f docker/compose.yml exec app sh

frontend-logs: ## Show frontend logs
	docker compose -f docker/compose.yml logs -f app

# Cleanup
clean: ## Clean up containers, networks, and volumes
	docker compose -f docker/compose.yml down -v --remove-orphans
	docker compose -f docker/compose.dev.yml down -v --remove-orphans
	docker system prune -f

clean-all: ## Clean up everything including images
	docker compose -f docker/compose.yml down -v --remove-orphans --rmi all
	docker compose -f docker/compose.dev.yml down -v --remove-orphans --rmi all
	docker system prune -af

# Health checks
health: ## Check health of all services
	@echo "Checking service health..."
	@curl -f http://localhost:8080/health || echo "Backend: UNHEALTHY"
	@curl -f http://localhost:3000/health || echo "Frontend: UNHEALTHY"
	@curl -f http://localhost:3001/health || echo "Landing: UNHEALTHY"

# Setup
setup: ## Setup development environment
	@echo "Setting up development environment..."
	@if [ ! -f backend/.env ]; then \
		cp backend/env.example backend/.env && echo "Created backend/.env from template"; \
	else \
		echo "backend/.env already exists, skipping..."; \
	fi
	@if [ ! -f docker/.env ]; then \
		cp docker/env.example docker/.env && echo "Created docker/.env from template"; \
	else \
		echo "docker/.env already exists, skipping..."; \
	fi
	@echo "Environment files are ready!"
	@echo "Please edit backend/.env and docker/.env with your configuration"
	@echo "Run 'make dev' to start development environment"

# Install dependencies
install: ## Install dependencies for all apps
	cd backend && go mod download
	cd apps/app && pnpm install
	cd apps/landing && pnpm install 