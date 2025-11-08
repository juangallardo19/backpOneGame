#!/bin/bash

# ========================================
# ONE GAME - Quick Start Script
# ========================================

set -e  # Exit on error

echo "🎮 ONE Game - Quick Start"
echo "=========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✅ .env created!${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit .env and configure:${NC}"
    echo "   - DATABASE_PASSWORD"
    echo "   - JWT_SECRET (generate with: openssl rand -base64 64)"
    echo ""
    read -p "Press Enter after you've edited .env..."
fi

# Check if Docker is running
echo "🔍 Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Ask user what to do
echo "What would you like to do?"
echo "1. Start all services (Docker Compose)"
echo "2. Stop all services"
echo "3. Restart all services"
echo "4. View logs"
echo "5. Clean everything (remove containers and volumes)"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting all services..."
        docker-compose up -d
        echo ""
        echo -e "${GREEN}✅ Services started!${NC}"
        echo ""
        echo "📊 Service Status:"
        docker-compose ps
        echo ""
        echo "🌐 Access your application:"
        echo "   Frontend:  http://localhost:3000"
        echo "   Backend:   http://localhost:8080"
        echo "   Health:    http://localhost:8080/actuator/health"
        echo ""
        echo "📝 View logs with: docker-compose logs -f"
        ;;
    2)
        echo ""
        echo "🛑 Stopping all services..."
        docker-compose down
        echo -e "${GREEN}✅ Services stopped${NC}"
        ;;
    3)
        echo ""
        echo "🔄 Restarting all services..."
        docker-compose down
        docker-compose up -d
        echo -e "${GREEN}✅ Services restarted${NC}"
        ;;
    4)
        echo ""
        echo "📝 Showing logs (Ctrl+C to exit)..."
        docker-compose logs -f
        ;;
    5)
        echo ""
        echo -e "${YELLOW}⚠️  This will remove all containers and data!${NC}"
        read -p "Are you sure? (y/N): " confirm
        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            echo "🗑️  Cleaning everything..."
            docker-compose down -v
            echo -e "${GREEN}✅ Cleaned successfully${NC}"
        else
            echo "Cancelled"
        fi
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
