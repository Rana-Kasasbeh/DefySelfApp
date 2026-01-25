#!/bin/bash

# 🚀 DefySelf Deployment Script
# This script helps deploy both backend and frontend

set -e

echo "🚀 Starting DefySelf Deployment..."

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

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi

    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi

    print_success "All requirements are met!"
}

# Setup backend for Heroku
setup_backend() {
    print_status "Setting up backend for Heroku..."

    # Copy backend package.json
    cp backend-package.json package.json

    # Install backend dependencies
    npm install

    print_success "Backend setup complete!"
}

# Setup frontend for Netlify
setup_frontend() {
    print_status "Setting up frontend for Netlify..."

    # Restore original package.json for React Native
    git checkout package.json

    # Install frontend dependencies
    npm install

    print_success "Frontend setup complete!"
}

# Deploy backend to Heroku
deploy_backend() {
    print_status "Deploying backend to Heroku..."

    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI is not installed. Please install it first: https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi

    # Check if Heroku app exists
    if ! heroku apps:info &> /dev/null; then
        print_warning "Heroku app not found. Please create one first:"
        echo "heroku create your-app-name"
        exit 1
    fi

    # Setup backend
    setup_backend

    # Deploy to Heroku
    git add .
    git commit -m "Deploy backend to Heroku" || true
    git push heroku main

    print_success "Backend deployed to Heroku!"
}

# Deploy frontend to Netlify
deploy_frontend() {
    print_status "Deploying frontend to Netlify..."

    # Setup frontend
    setup_frontend

    # Build the app
    npm run build

    # Check if netlify-cli is installed
    if ! command -v netlify &> /dev/null; then
        print_warning "Netlify CLI not installed. Installing..."
        npm install -g netlify-cli
    fi

    # Deploy to Netlify
    netlify deploy --prod --dir=dist

    print_success "Frontend deployed to Netlify!"
}

# Main menu
show_menu() {
    echo "========================================"
    echo "🚀 DefySelf Deployment Script"
    echo "========================================"
    echo "1. Check Requirements"
    echo "2. Setup Backend (Heroku)"
    echo "3. Setup Frontend (Netlify)"
    echo "4. Deploy Backend to Heroku"
    echo "5. Deploy Frontend to Netlify"
    echo "6. Deploy Both"
    echo "7. Exit"
    echo "========================================"
    echo -n "Choose an option (1-7): "
}

# Main script
main() {
    while true; do
        show_menu
        read choice

        case $choice in
            1)
                check_requirements
                ;;
            2)
                setup_backend
                ;;
            3)
                setup_frontend
                ;;
            4)
                deploy_backend
                ;;
            5)
                deploy_frontend
                ;;
            6)
                print_status "Deploying both backend and frontend..."
                deploy_backend
                deploy_frontend
                print_success "Both deployments completed!"
                ;;
            7)
                print_status "Goodbye! 👋"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-7."
                ;;
        esac

        echo ""
        read -p "Press Enter to continue..."
        clear
    done
}

# Run main function
main