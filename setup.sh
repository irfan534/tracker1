#!/bin/bash

# Tracker Setup Script
echo "🚀 Starting Tracker Compliance Platform Setup"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 1. Check for required tools
print_step "Checking requirements..."

command -v docker >/dev/null 2>&1 || { print_error "Docker is required but not installed. Aborting."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { print_error "docker-compose is required but not installed. Aborting."; exit 1; }
command -v node >/dev/null 2>&1 || { print_error "Node.js is required but not installed. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { print_error "npm is required but not installed. Aborting."; exit 1; }

print_status "All requirements met ✓"

# 2. Environment configuration
print_step "Configuring environment..."

if [ ! -f "docker/.env" ]; then
    cp docker/.env.example docker/.env

    # Generate secure random values
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    DB_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")

    # Update .env with generated values
    # Using sed with cross-platform compatibility
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=\"$JWT_SECRET\"/" docker/.env
        sed -i '' "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=\"$REFRESH_SECRET\"/" docker/.env
        sed -i '' "s/DB_PASSWORD=.*/DB_PASSWORD=\"$DB_PASSWORD\"/" docker/.env
        # Also update DATABASE_URL password
        sed -i '' "s/:your_secure_password@/:$DB_PASSWORD@/" docker/.env
    else
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=\"$JWT_SECRET\"/" docker/.env
        sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=\"$REFRESH_SECRET\"/" docker/.env
        sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=\"$DB_PASSWORD\"/" docker/.env
        sed -i "s/:your_secure_password@/:$DB_PASSWORD@/" docker/.env
    fi
    print_status ".env file created with secure secrets ✓"
else
    print_status ".env file already exists. Skipping generation."
fi

# 3. Start Docker services
print_step "Starting Docker containers..."
cd docker
DOCKER_BUILDKIT=1 docker-compose up -d --build

# 4. Wait for services to be ready
print_step "Waiting for services to be ready (this may take a minute)..."

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    HEALTH=$(curl -s http://localhost:3001/health)
    if [[ $HEALTH == *"\"status\":\"ok\""* ]] && [[ $HEALTH == *"\"db\":\"connected\""* ]]; then
        print_status "Backend and Database are ready ✓"
        break
    fi
    echo -n "."
    sleep 5
    ((RETRY_COUNT++))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Timed out waiting for services to be ready. Please check 'docker-compose logs'."
    exit 1
fi

# 5. Success message
echo ""
echo -e "${GREEN}=============================================="
echo "🎉 Tracker Platform Setup Complete!"
echo "=============================================="
echo ""
echo "📍 URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "🔑 Default Credentials:"
echo "   Email:    admin@tracker.local"
echo "   Password: Admin@123456"
echo ""
echo "📝 Next Steps:"
echo "   - View the dashboard at http://localhost:3000"
echo "   - Explore the API docs at http://localhost:3001/api"
echo "==============================================${NC}"
