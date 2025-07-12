#!/bin/bash

# YTClipper PR Deployment Cleanup Script
# Usage: ./cleanup-pr-deployment.sh <PR_NUMBER>
# Example: ./cleanup-pr-deployment.sh 123

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if PR number is provided
if [ $# -eq 0 ]; then
    print_error "Usage: $0 <PR_NUMBER>"
    print_error "Example: $0 123"
    exit 1
fi

PR_NUMBER="$1"
BRANCH="pr-${PR_NUMBER}"

print_info "🧹 Starting cleanup for PR #${PR_NUMBER}"
print_info "🔍 Branch: ${BRANCH}"
echo ""

# Container names
BACKEND_CONTAINER="ytclipper-${BRANCH}-backend"
FRONTEND_CONTAINER="ytclipper-${BRANCH}-app"

# Domain names
BACKEND_DOMAIN="api-${BRANCH}.ytclipper.com"
FRONTEND_DOMAIN="app-${BRANCH}.ytclipper.com"

# Deployment directory
DEPLOYMENT_DIR="/opt/ytclipper/deployments/${BRANCH}"

print_step "1. Stopping and removing containers"
echo "🔍 Looking for containers:"
echo "  - ${BACKEND_CONTAINER}"
echo "  - ${FRONTEND_CONTAINER}"
echo ""

# Function to stop and remove container
cleanup_container() {
    local container_name=$1
    local container_type=$2
    
    print_info "Processing ${container_type} container: ${container_name}"
    
    # Check if container exists
    if docker ps -a --format "{{.Names}}" | grep -q "^${container_name}$"; then
        print_info "✅ Found container: ${container_name}"
        
        # Stop container if running
        if docker ps --format "{{.Names}}" | grep -q "^${container_name}$"; then
            print_info "🛑 Stopping container: ${container_name}"
            docker stop "${container_name}" || print_warning "Failed to stop ${container_name}"
        else
            print_info "ℹ️  Container already stopped: ${container_name}"
        fi
        
        # Remove container
        print_info "🗑️  Removing container: ${container_name}"
        docker rm "${container_name}" || print_warning "Failed to remove ${container_name}"
        
        print_info "✅ Container ${container_name} cleaned up"
    else
        print_warning "Container not found: ${container_name}"
    fi
    echo ""
}

# Cleanup containers
cleanup_container "${BACKEND_CONTAINER}" "backend"
cleanup_container "${FRONTEND_CONTAINER}" "frontend"

print_step "2. Removing Docker images used by containers"
echo "🔍 Looking for images with tags:"
echo "  - pr-${PR_NUMBER}"
echo "  - ${BRANCH}"
echo ""

# Function to remove images by tag pattern
cleanup_images() {
    local tag_pattern=$1
    
    print_info "Searching for images with tag pattern: ${tag_pattern}"
    
    # Find images with the tag pattern
    IMAGES=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "${tag_pattern}" || true)
    
    if [ -n "$IMAGES" ]; then
        echo "$IMAGES" | while read -r image; do
            if [ -n "$image" ]; then
                print_info "🗑️  Removing image: $image"
                docker rmi "$image" || print_warning "Failed to remove image: $image"
            fi
        done
    else
        print_info "ℹ️  No images found with pattern: ${tag_pattern}"
    fi
}

# Remove images with PR tag patterns
cleanup_images "pr-${PR_NUMBER}"
cleanup_images "${BRANCH}"

# Also remove any dangling images
print_info "🧹 Removing dangling images..."
docker image prune -f || print_warning "Failed to prune dangling images"

echo ""

print_step "3. Removing deployment directory"
print_info "🔍 Checking directory: ${DEPLOYMENT_DIR}"

if [ -d "${DEPLOYMENT_DIR}" ]; then
    print_info "✅ Found deployment directory: ${DEPLOYMENT_DIR}"
    print_info "📁 Contents:"
    ls -la "${DEPLOYMENT_DIR}" || true
    echo ""
    
    print_info "🗑️  Removing deployment directory: ${DEPLOYMENT_DIR}"
    rm -rf "${DEPLOYMENT_DIR}"
    print_info "✅ Deployment directory removed"
else
    print_warning "Deployment directory not found: ${DEPLOYMENT_DIR}"
fi

echo ""

print_step "4. Removing Nginx configurations"

# Function to remove nginx config
remove_nginx_config() {
    local domain=$1
    local config_type=$2
    
    print_info "Processing ${config_type} nginx config: ${domain}"
    
    local sites_available="/etc/nginx/sites-available/${domain}"
    local sites_enabled="/etc/nginx/sites-enabled/${domain}"
    
    # Remove from sites-enabled
    if [ -f "${sites_enabled}" ]; then
        print_info "🗑️  Removing sites-enabled: ${sites_enabled}"
        sudo rm -f "${sites_enabled}" || print_warning "Failed to remove ${sites_enabled}"
    else
        print_info "ℹ️  No sites-enabled found: ${sites_enabled}"
    fi
    
    # Remove from sites-available
    if [ -f "${sites_available}" ]; then
        print_info "🗑️  Removing sites-available: ${sites_available}"
        sudo rm -f "${sites_available}" || print_warning "Failed to remove ${sites_available}"
    else
        print_info "ℹ️  No sites-available found: ${sites_available}"
    fi
    
    echo ""
}

# Remove nginx configs
remove_nginx_config "${BACKEND_DOMAIN}" "backend"
remove_nginx_config "${FRONTEND_DOMAIN}" "frontend"

print_step "5. Testing and reloading Nginx"
print_info "🔧 Testing nginx configuration..."

if sudo nginx -t 2>/dev/null; then
    print_info "✅ Nginx configuration test passed"
    print_info "🔄 Reloading nginx..."
    sudo systemctl reload nginx || print_warning "Failed to reload nginx"
    print_info "✅ Nginx reloaded successfully"
else
    print_error "❌ Nginx configuration test failed!"
    print_error "Please check nginx configuration manually:"
    print_error "  sudo nginx -t"
    print_error "  sudo systemctl status nginx"
fi

echo ""

print_step "6. Final cleanup summary"
print_info "📊 Cleanup completed for PR #${PR_NUMBER}"
echo ""
print_info "✅ Processed items:"
echo "  🐳 Containers:"
echo "    - ${BACKEND_CONTAINER}"
echo "    - ${FRONTEND_CONTAINER}"
echo "  🖼️  Docker images with tags:"
echo "    - pr-${PR_NUMBER}"
echo "    - ${BRANCH}"
echo "  📁 Directories:"
echo "    - ${DEPLOYMENT_DIR}"
echo "  🌐 Nginx configs:"
echo "    - ${BACKEND_DOMAIN}"
echo "    - ${FRONTEND_DOMAIN}"
echo ""

print_step "7. Verification"
print_info "🔍 Verifying cleanup..."

# Check remaining containers
REMAINING_CONTAINERS=$(docker ps -a --format "{{.Names}}" | grep -E "(${BRANCH}|pr-${PR_NUMBER})" || true)
if [ -n "$REMAINING_CONTAINERS" ]; then
    print_warning "⚠️  Some containers may still exist:"
    echo "$REMAINING_CONTAINERS"
else
    print_info "✅ No containers found with PR patterns"
fi

# Check remaining images
REMAINING_IMAGES=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "(${BRANCH}|pr-${PR_NUMBER})" || true)
if [ -n "$REMAINING_IMAGES" ]; then
    print_warning "⚠️  Some images may still exist:"
    echo "$REMAINING_IMAGES"
else
    print_info "✅ No images found with PR patterns"
fi

# Check directory
if [ -d "${DEPLOYMENT_DIR}" ]; then
    print_warning "⚠️  Deployment directory still exists: ${DEPLOYMENT_DIR}"
else
    print_info "✅ Deployment directory successfully removed"
fi

# Check nginx configs
REMAINING_NGINX=$(find /etc/nginx/sites-* -name "*${BRANCH}*" -o -name "*pr-${PR_NUMBER}*" 2>/dev/null || true)
if [ -n "$REMAINING_NGINX" ]; then
    print_warning "⚠️  Some nginx configs may still exist:"
    echo "$REMAINING_NGINX"
else
    print_info "✅ No nginx configs found with PR patterns"
fi

echo ""
print_info "🎉 Cleanup script completed for PR #${PR_NUMBER}!"
print_info "💡 If you see any warnings above, you may need to clean them up manually." 