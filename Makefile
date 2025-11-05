.PHONY: help build up down restart logs status clean dev prod

# Default target
help:
	@echo "Typing Toy - Docker Commands"
	@echo "=============================="
	@echo ""
	@echo "Available commands:"
	@echo "  make build     - Build Docker images"
	@echo "  make up        - Start services in development mode"
	@echo "  make down      - Stop all services"
	@echo "  make restart   - Restart all services"
	@echo "  make logs      - View logs (all services)"
	@echo "  make logs-app  - View app logs only"
	@echo "  make logs-db   - View MongoDB logs only"
	@echo "  make status    - Show service status"
	@echo "  make clean     - Remove containers and volumes"
	@echo "  make dev       - Start in development mode"
	@echo "  make prod      - Start in production mode"
	@echo "  make shell     - Open shell in app container"
	@echo "  make db-shell  - Open MongoDB shell"

# Build images
build:
	docker compose build

# Start services (development)
up dev:
	docker compose up -d
	@echo "✅ Services started in development mode"
	@echo "🌐 App: http://localhost:3000"

# Start services (production)
prod:
	docker compose -f docker compose.yml -f docker compose.prod.yml up -d
	@echo "✅ Services started in production mode"
	@echo "🌐 App: http://localhost:3000"

# Stop services
down:
	docker compose down
	@echo "✅ Services stopped"

# Restart services
restart:
	docker compose restart
	@echo "✅ Services restarted"

# View logs (all)
logs:
	docker compose logs -f

# View app logs
logs-app:
	docker compose logs -f app

# View MongoDB logs
logs-db:
	docker compose logs -f mongodb

# Show status
status:
	docker compose ps

# Clean up (remove containers and volumes)
clean:
	@echo "⚠️  WARNING: This will remove all containers and volumes"
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	docker compose down -v
	@echo "✅ Cleanup complete"

# Open shell in app container
shell:
	docker compose exec app sh

# Open MongoDB shell
db-shell:
	docker compose exec mongodb mongosh typingtoy

# Rebuild and restart
rebuild:
	docker compose up -d --build
	@echo "✅ Rebuild complete"
