#!/usr/bin/env bash

# Use this script to start the database and run migrations
# From project root: ./scripts/setup-db.sh
# On Windows (WSL): wsl ./scripts/setup-db.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIR="$PROJECT_ROOT/apps/web"

cd "$WEB_DIR"

# Default database configuration
DEFAULT_DB_USER="postgres"
DEFAULT_DB_PASSWORD="password"
DEFAULT_DB_NAME="trade_binder"
DEFAULT_DB_PORT="5432"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating .env file with default database configuration in apps/web..."
  cat > ".env" << EOF
# Database configuration for local development
POSTGRES_USER=$DEFAULT_DB_USER
POSTGRES_PASSWORD=$DEFAULT_DB_PASSWORD
POSTGRES_DB=$DEFAULT_DB_NAME
DATABASE_URL="postgresql://$DEFAULT_DB_USER:$DEFAULT_DB_PASSWORD@localhost:$DEFAULT_DB_PORT/$DEFAULT_DB_NAME?sslmode=disable"
EOF
  echo "Created .env file"
fi

# Source the .env file
set -a
source ".env"
set +a

# Check if DATABASE_URL exists in .env, if not append it
if ! grep -q "^DATABASE_URL=" ".env"; then
  DB_USER="${POSTGRES_USER:-$DEFAULT_DB_USER}"
  DB_PASSWORD="${POSTGRES_PASSWORD:-$DEFAULT_DB_PASSWORD}"
  DB_NAME="${POSTGRES_DB:-$DEFAULT_DB_NAME}"
  echo "" >> ".env"
  echo "# Database connection string" >> ".env"
  echo "DATABASE_URL=\"postgresql://$DB_USER:$DB_PASSWORD@localhost:$DEFAULT_DB_PORT/$DB_NAME?sslmode=disable\"" >> ".env"
  echo "Appended DATABASE_URL to .env file"
  # Re-source to get the new DATABASE_URL
  source ".env"
fi

# Determine docker compose command (modern "docker compose" vs legacy "docker-compose")
if docker compose version > /dev/null 2>&1; then
  DOCKER_COMPOSE="docker compose"
elif command -v docker-compose > /dev/null 2>&1; then
  DOCKER_COMPOSE="docker-compose"
else
  echo "Error: Neither 'docker compose' nor 'docker-compose' found. Please install Docker."
  exit 1
fi

# Start docker-compose
echo "Starting database with $DOCKER_COMPOSE..."
$DOCKER_COMPOSE up -d

# Wait for postgres to be ready
echo "Waiting for PostgreSQL to be ready..."
until $DOCKER_COMPOSE exec -T db pg_isready -U "${POSTGRES_USER:-postgres}" > /dev/null 2>&1; do
  echo "  Postgres is not ready yet, waiting..."
  sleep 2
done
echo "PostgreSQL is ready!"

# Run migrations
echo "Running database migrations..."
pnpm migrate

echo ""
echo "Database is up and migrations are complete!"
echo "DATABASE_URL: $DATABASE_URL"

