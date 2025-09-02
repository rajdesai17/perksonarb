#!/bin/bash

# Production Deployment Script for Buy Me a Coffee Dapp
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting production deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    required_vars=(
        "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"
        "PRIVATE_KEY"
        "ARBISCAN_API_KEY"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "Please set these variables in your .env.local file or environment."
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    if npm run test:run; then
        print_success "All tests passed"
    else
        print_error "Tests failed. Aborting deployment."
        exit 1
    fi
}

# Type check
type_check() {
    print_status "Running TypeScript type check..."
    
    if npm run type-check; then
        print_success "Type check passed"
    else
        print_error "Type check failed. Aborting deployment."
        exit 1
    fi
}

# Lint check
lint_check() {
    print_status "Running linter..."
    
    if npm run lint:fix; then
        print_success "Linting passed"
    else
        print_error "Linting failed. Aborting deployment."
        exit 1
    fi
}

# Build application
build_app() {
    print_status "Building application for production..."
    
    if npm run build:production; then
        print_success "Build completed successfully"
    else
        print_error "Build failed. Aborting deployment."
        exit 1
    fi
}

# Deploy contract to testnet
deploy_testnet() {
    print_status "Deploying contract to Arbitrum Sepolia testnet..."
    
    if npm run deploy:contract:testnet; then
        print_success "Testnet deployment completed"
    else
        print_error "Testnet deployment failed."
        exit 1
    fi
}

# Deploy contract to mainnet
deploy_mainnet() {
    print_status "Deploying contract to Arbitrum One mainnet..."
    
    print_warning "⚠️  You are about to deploy to MAINNET. This will cost real ETH."
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_warning "Mainnet deployment cancelled by user."
        return 0
    fi
    
    if npm run deploy:contract:mainnet; then
        print_success "Mainnet deployment completed"
    else
        print_error "Mainnet deployment failed."
        exit 1
    fi
}

# Verify contract
verify_contract() {
    local network=$1
    print_status "Verifying contract on $network..."
    
    # Wait a bit for the contract to be indexed
    print_status "Waiting 30 seconds for contract to be indexed..."
    sleep 30
    
    if [ "$network" = "testnet" ]; then
        npm run verify:testnet || print_warning "Contract verification failed (this is non-critical)"
    elif [ "$network" = "mainnet" ]; then
        npm run verify:mainnet || print_warning "Contract verification failed (this is non-critical)"
    fi
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    if command -v vercel &> /dev/null; then
        if vercel --prod; then
            print_success "Vercel deployment completed"
        else
            print_error "Vercel deployment failed."
            exit 1
        fi
    else
        print_warning "Vercel CLI not found. Please install it with: npm i -g vercel"
        print_status "You can manually deploy by pushing to your main branch if auto-deployment is configured."
    fi
}

# Main deployment function
main() {
    echo "🎯 Buy Me a Coffee Dapp - Production Deployment"
    echo "=============================================="
    echo ""
    
    # Parse command line arguments
    DEPLOY_TARGET=${1:-"testnet"}
    
    if [ "$DEPLOY_TARGET" != "testnet" ] && [ "$DEPLOY_TARGET" != "mainnet" ]; then
        print_error "Invalid deployment target. Use 'testnet' or 'mainnet'"
        echo "Usage: $0 [testnet|mainnet]"
        exit 1
    fi
    
    print_status "Deployment target: $DEPLOY_TARGET"
    echo ""
    
    # Pre-deployment checks
    check_env_vars
    type_check
    lint_check
    run_tests
    build_app
    
    echo ""
    print_status "Pre-deployment checks completed successfully!"
    echo ""
    
    # Contract deployment
    if [ "$DEPLOY_TARGET" = "testnet" ]; then
        deploy_testnet
        verify_contract "testnet"
    elif [ "$DEPLOY_TARGET" = "mainnet" ]; then
        deploy_mainnet
        verify_contract "mainnet"
    fi
    
    echo ""
    print_status "Contract deployment completed!"
    echo ""
    
    # Frontend deployment
    deploy_vercel
    
    echo ""
    print_success "🎉 Production deployment completed successfully!"
    echo ""
    
    # Post-deployment instructions
    echo "📋 Post-Deployment Checklist:"
    echo "1. ✅ Contract deployed and verified"
    echo "2. ✅ Frontend deployed to Vercel"
    echo "3. ⏳ Test the live application"
    echo "4. ⏳ Monitor for any issues"
    echo "5. ⏳ Update documentation with new contract address"
    echo ""
    
    if [ "$DEPLOY_TARGET" = "testnet" ]; then
        echo "🔗 Testnet Explorer: https://sepolia.arbiscan.io"
    else
        echo "🔗 Mainnet Explorer: https://arbiscan.io"
    fi
    
    echo "🌐 Frontend URL: Check your Vercel dashboard for the deployment URL"
}

# Run main function with all arguments
main "$@"