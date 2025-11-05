#!/bin/bash

# Docker Deployment Script for Typing Toy
# This script helps you deploy the application using Docker Compose

set -e

echo "🚀 Typing Toy Docker Deployment"
echo "================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    echo "❌ Error: Docker Compose is not installed"
    echo "Please install Docker Compose from https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please edit .env and set your environment variables before continuing"
    echo ""
    echo "Important variables to set:"
    echo "  - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
    echo "  - AUTH_SECRET (same as NEXTAUTH_SECRET)"
    echo "  - MONGODB_URI (use: mongodb://mongodb:27017/typingtoy for Docker)"
    echo ""
    read -p "Press Enter after editing .env file to continue, or Ctrl+C to exit..."
fi

# Parse command line arguments
MODE=${1:-"dev"}

case $MODE in
    "dev"|"development")
        echo "📦 Starting in DEVELOPMENT mode..."
        docker compose up -d --build
        ;;
    "prod"|"production")
        echo "🏭 Starting in PRODUCTION mode..."
        docker compose -f docker compose.yml -f docker compose.prod.yml up -d --build
        ;;
    "stop")
        echo "🛑 Stopping all services..."
        docker compose down
        echo "✅ All services stopped"
        exit 0
        ;;
    "restart")
        echo "🔄 Restarting services..."
        docker compose restart
        echo "✅ Services restarted"
        exit 0
        ;;
    "logs")
        echo "📋 Showing logs (Ctrl+C to exit)..."
        docker compose logs -f
        exit 0
        ;;
    "status")
        echo "📊 Service status:"
        docker compose ps
        exit 0
        ;;
    "clean")
        echo "⚠️  WARNING: This will remove all containers and volumes"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            docker compose down -v
            echo "✅ Cleanup complete"
        else
            echo "❌ Cleanup cancelled"
        fi
        exit 0
        ;;
    *)
        echo "❌ Unknown command: $MODE"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  dev|development  - Start in development mode (default)"
        echo "  prod|production  - Start in production mode"
        echo "  stop             - Stop all services"
        echo "  restart          - Restart all services"
        echo "  logs             - View logs"
        echo "  status           - Show service status"
        echo "  clean            - Remove all containers and volumes"
        exit 1
        ;;
esac

echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# Check if services are running
if docker compose ps | grep -q "Up"; then
    echo "✅ Services started successfully!"
    echo ""
    echo "🌐 Application URLs:"
    echo "   - App: http://localhost:3000"
    echo "   - MongoDB: localhost:27017"
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs:    docker compose logs -f"
    echo "   Stop:         docker compose down"
    echo "   Restart:      docker compose restart"
    echo "   Status:       docker compose ps"
else
    echo "❌ Error: Services failed to start"
    echo "Check logs with: docker compose logs"
    exit 1
fi
