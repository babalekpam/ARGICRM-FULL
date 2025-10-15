#!/bin/bash

# ============================================================================
# ARGILETTE Integration Installer
# ============================================================================
# This script helps you integrate ARGILETTE SEO analytics into your CRM
# Usage: ./install.sh [YOUR_CRM_PATH]
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Get CRM path
CRM_PATH="${1:-.}"

if [ ! -d "$CRM_PATH" ]; then
    print_error "Directory $CRM_PATH does not exist"
    exit 1
fi

print_header "ARGILETTE Integration Installer"

echo -e "\nInstalling ARGILETTE into: ${GREEN}$CRM_PATH${NC}\n"

# Confirm
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Installation cancelled"
    exit 1
fi

# Step 1: Create directories
print_header "Step 1: Creating directories"

mkdir -p "$CRM_PATH/server/seo"
mkdir -p "$CRM_PATH/client/src/seo"
mkdir -p "$CRM_PATH/database"

print_success "Directories created"

# Step 2: Copy server files
print_header "Step 2: Copying server files"

if [ -d "server" ]; then
    cp -r server/* "$CRM_PATH/server/seo/"
    print_success "Server files copied to $CRM_PATH/server/seo/"
else
    print_warning "Server files not found in integration package"
fi

# Step 3: Copy client files (optional)
print_header "Step 3: Copying client files (optional)"

if [ -d "client" ]; then
    cp -r client/* "$CRM_PATH/client/src/seo/"
    print_success "Client files copied to $CRM_PATH/client/src/seo/"
else
    print_warning "Client files not found - skipping"
fi

# Step 4: Copy database schema
print_header "Step 4: Copying database schema"

if [ -f "database/schema.sql" ]; then
    cp database/schema.sql "$CRM_PATH/database/argilette-schema.sql"
    print_success "Database schema copied to $CRM_PATH/database/argilette-schema.sql"
else
    print_error "Database schema not found"
fi

# Step 5: Copy environment template
print_header "Step 5: Setting up environment variables"

if [ -f "config/.env.example" ]; then
    if [ ! -f "$CRM_PATH/.env" ]; then
        cp config/.env.example "$CRM_PATH/.env"
        print_success "Created .env file from template"
    else
        print_warning ".env already exists - see config/.env.example for required variables"
    fi
fi

# Step 6: Install dependencies
print_header "Step 6: Installing dependencies"

if [ -f "$CRM_PATH/package.json" ]; then
    cd "$CRM_PATH"
    
    echo "Installing required packages..."
    npm install @anthropic-ai/sdk recharts react-i18next i18next i18next-browser-languagedetector drizzle-orm @neondatabase/serverless zod --save
    
    print_success "Dependencies installed"
    cd - > /dev/null
else
    print_warning "No package.json found in $CRM_PATH - install dependencies manually"
fi

# Step 7: Database setup
print_header "Step 7: Database setup"

if [ -n "$DATABASE_URL" ]; then
    read -p "Run database migration now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        psql "$DATABASE_URL" -f "$CRM_PATH/database/argilette-schema.sql"
        print_success "Database migration completed"
    else
        print_warning "Run manually: psql \$DATABASE_URL -f database/argilette-schema.sql"
    fi
else
    print_warning "DATABASE_URL not set - run migration manually"
fi

# Step 8: Generate integration code
print_header "Step 8: Integration code"

INTEGRATION_CODE="$CRM_PATH/server/integrate-argilette.js"

cat > "$INTEGRATION_CODE" << 'EOF'
/**
 * ARGILETTE Integration
 * Add this to your CRM's server file
 */

import { registerSEORoutes } from './seo/routes.js';

// In your server setup, add:
export function setupARGILETTE(app, options = {}) {
  const {
    authMiddleware,    // Your CRM's auth middleware
    tenantMiddleware,  // Your CRM's tenant/org middleware
    basePath = '/api/seo'
  } = options;

  registerSEORoutes(app, {
    basePath,
    authMiddleware,
    tenantMiddleware
  });

  console.log(`✅ ARGILETTE SEO routes registered at ${basePath}`);
}

// Usage in your server/index.js:
// import { setupARGILETTE } from './integrate-argilette.js';
// 
// setupARGILETTE(app, {
//   authMiddleware: requireAuth,
//   tenantMiddleware: attachOrganization
// });
EOF

print_success "Integration code generated at $INTEGRATION_CODE"

# Final summary
print_header "Installation Complete! 🎉"

echo -e "\n${GREEN}Next steps:${NC}"
echo "1. Add to your server file:"
echo -e "   ${BLUE}import { setupARGILETTE } from './integrate-argilette.js';${NC}"
echo -e "   ${BLUE}setupARGILETTE(app, { authMiddleware, tenantMiddleware });${NC}"
echo ""
echo "2. Set environment variables in .env:"
echo -e "   ${BLUE}ANTHROPIC_API_KEY=your_key${NC}"
echo ""
echo "3. Update your navigation to include SEO section"
echo ""
echo "4. Restart your server and visit /api/seo/dashboard"
echo ""
echo -e "${GREEN}Documentation:${NC}"
echo "- Quick Start: integration-package/QUICK_START.md"
echo "- Full Guide: integration-package/README.md"
echo "- API Docs: integration-package/docs/API.md"
echo ""
echo -e "${YELLOW}Need help? Check the examples/ folder${NC}"
echo ""

print_success "ARGILETTE is ready to use!"
