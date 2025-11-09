#!/bin/bash

# QChat Production Setup Script
# This script helps set up QChat for production deployment

set -e

echo "============================================"
echo "QChat Production Setup"
echo "============================================"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then
   echo -e "${RED}Please do not run this script as root${NC}"
   exit 1
fi

# Check Node.js version
echo -e "${YELLOW}Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js 18 or higher is required. Current version: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js version OK: $(node -v)${NC}"
echo ""

# Check if .env exists
echo -e "${YELLOW}Checking environment configuration...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo -e "${RED}⚠ IMPORTANT: Edit .env file and configure your settings!${NC}"
    echo ""
else
    echo -e "${GREEN}✓ .env file exists${NC}"
    echo ""
fi

# Generate session secret if not set
echo -e "${YELLOW}Checking session secret...${NC}"
if grep -q "change-this-to-random-string" .env; then
    echo -e "${YELLOW}Generating session secret...${NC}"
    SESSION_SECRET=$(openssl rand -base64 64 | tr -d '\n')

    # Use different sed syntax for macOS vs Linux
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|" .env
    else
        sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=$SESSION_SECRET|" .env
    fi

    echo -e "${GREEN}✓ Generated new session secret${NC}"
else
    echo -e "${GREEN}✓ Session secret already configured${NC}"
fi
echo ""

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Build application
echo -e "${YELLOW}Building application...${NC}"
npm run build
echo -e "${GREEN}✓ Application built successfully${NC}"
echo ""

# Check database connection
echo -e "${YELLOW}Checking database connection...${NC}"
if grep -q "DATABASE_URL=postgresql" .env; then
    # Extract database URL
    DB_URL=$(grep DATABASE_URL .env | cut -d'=' -f2-)

    # Test connection (this will fail if network is restricted)
    echo -e "${YELLOW}Testing database connection...${NC}"
    echo -e "${YELLOW}(This may fail if database is not accessible from this environment)${NC}"

    # Try to push schema
    npm run db:push || echo -e "${YELLOW}⚠ Database migration failed. You may need to run this manually in production.${NC}"
else
    echo -e "${YELLOW}⚠ Using SQLite (development mode)${NC}"
    echo -e "${YELLOW}For production, configure DATABASE_URL in .env${NC}"
fi
echo ""

# Create necessary directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p logs uploads
echo -e "${GREEN}✓ Created logs and uploads directories${NC}"
echo ""

# Check if PM2 is installed
echo -e "${YELLOW}Checking for PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 not found. Install with: npm install -g pm2${NC}"
else
    echo -e "${GREEN}✓ PM2 is installed${NC}"
fi
echo ""

# Summary
echo "============================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Edit .env file and configure your production settings"
echo "2. Set DATABASE_URL to your PostgreSQL connection string"
echo "3. Configure CORS_ORIGIN to your domain"
echo "4. Review security settings in .env"
echo ""
echo "To start the application:"
echo "  npm start                     # Direct Node.js"
echo "  pm2 start dist/index.js       # Using PM2"
echo "  docker-compose up -d          # Using Docker"
echo ""
echo "To run database migrations:"
echo "  npm run db:push"
echo ""
echo "Health checks available at:"
echo "  http://localhost:5000/health"
echo ""
echo -e "${YELLOW}Read PRODUCTION_DEPLOYMENT.md for complete deployment guide${NC}"
echo ""
