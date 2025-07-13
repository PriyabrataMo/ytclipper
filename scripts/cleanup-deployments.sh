#!/bin/bash

# YTClipper VPS Deployment Cleanup Script
# This script helps reorganize your VPS deployments into the new structure

set -e

echo "🧹 YTClipper VPS Deployment Cleanup"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're on the VPS
if [ ! -d "/opt" ]; then
    print_error "This script should be run on your VPS server"
    exit 1
fi

print_status "Starting cleanup process..."

# Create new directory structure
print_status "Creating new directory structure..."
mkdir -p /opt/ytclipper/production
mkdir -p /opt/ytclipper/deployments

# Function to stop and remove containers
cleanup_containers() {
    local pattern=$1
    print_status "Stopping containers matching pattern: $pattern"
    
    containers=$(docker ps -a --filter "name=$pattern" --format "{{.Names}}" 2>/dev/null || true)
    if [ -n "$containers" ]; then
        echo "$containers" | while read container; do
            print_status "Stopping container: $container"
            docker stop "$container" 2>/dev/null || true
            docker rm "$container" 2>/dev/null || true
        done
    else
        print_status "No containers found matching pattern: $pattern"
    fi
}

# Function to cleanup nginx configs
cleanup_nginx() {
    local domain_pattern=$1
    print_status "Cleaning up nginx configs for pattern: $domain_pattern"
    
    # Find and remove nginx configs
    find /etc/nginx/sites-available/ -name "*$domain_pattern*" -type f 2>/dev/null | while read config; do
        domain=$(basename "$config")
        print_status "Removing nginx config: $domain"
        sudo rm -f "/etc/nginx/sites-enabled/$domain" 2>/dev/null || true
        sudo rm -f "/etc/nginx/sites-available/$domain" 2>/dev/null || true
    done
}

# Stop all ytclipper containers
print_status "Stopping all YTClipper containers..."
cleanup_containers "ytclipper-*"

# Clean up nginx configs
print_status "Cleaning up nginx configurations..."
cleanup_nginx "app-"
cleanup_nginx "api-"

# Reload nginx
print_status "Reloading nginx..."
sudo nginx -t && sudo systemctl reload nginx

# Move existing deployments to new structure
print_status "Reorganizing deployment directories..."

# List of old directories to check and clean up
OLD_DIRS=(
    "/opt/ytclipper-frontend"
    "/opt/ytclipper-backend"
    "/opt/ytclipper-app-staging"
    "/opt/ytclipper-staging"
)

for dir in "${OLD_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        print_warning "Found old deployment directory: $dir"
        
        # Check if it contains useful files
        if [ -f "$dir/compose.yml" ] || [ -f "$dir/.env" ]; then
            print_status "Backing up configuration files from $dir"
            backup_dir="/opt/ytclipper/backup/$(basename $dir)-$(date +%Y%m%d-%H%M%S)"
            mkdir -p "$backup_dir"
            cp -r "$dir"/* "$backup_dir/" 2>/dev/null || true
            print_status "Backup created at: $backup_dir"
        fi
        
        print_status "Removing old directory: $dir"
        rm -rf "$dir"
    fi
done

# Clean up any remaining branch-specific directories
print_status "Cleaning up branch-specific directories..."
find /opt -maxdepth 2 -type d -name "*ytclipper*" -not -path "/opt/ytclipper*" 2>/dev/null | while read dir; do
    if [ -d "$dir" ]; then
        print_warning "Found orphaned directory: $dir"
        print_status "Removing: $dir"
        rm -rf "$dir"
    fi
done

# Clean up unused Docker images
print_status "Cleaning up unused Docker images..."
docker image prune -f 2>/dev/null || true

# Clean up unused Docker volumes
print_status "Cleaning up unused Docker volumes..."
docker volume prune -f 2>/dev/null || true

# Set proper permissions
print_status "Setting proper permissions..."
chown -R $USER:$USER /opt/ytclipper 2>/dev/null || true
chmod -R 755 /opt/ytclipper 2>/dev/null || true

print_status "Cleanup completed successfully!"
echo ""
echo "📁 New directory structure:"
echo "   /opt/ytclipper/"
echo "   ├── production/          # Production deployments"
echo "   ├── deployments/         # Staging/PR deployments"
echo "   │   ├── staging/         # Staging branch"
echo "   │   ├── pr-123/          # PR #123 deployment"
echo "   │   └── pr-456/          # PR #456 deployment"
echo "   └── backup/              # Backup of old configs"
echo ""
echo "🎉 Your VPS is now ready for the new deployment structure!"
echo ""
echo "Next steps:"
echo "1. Push your updated workflows to trigger new deployments"
echo "2. PR deployments will automatically create subdirectories"
echo "3. Closed PRs will automatically clean up their deployments" 