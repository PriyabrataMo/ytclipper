#!/bin/bash

set -e

echo "🧹 Cleaning up conflicting Docker networks..."

# List current networks
echo "📋 Current Docker networks:"
docker network ls

# Remove conflicting networks (if they exist and are not in use)
CONFLICTING_NETWORKS=(
    "backend_ytclipper-network"
    "frontend_ytclipper-network"
    "ytclipper-network"
)

for network in "${CONFLICTING_NETWORKS[@]}"; do
    if docker network ls | grep -q "$network"; then
        echo "🗑️  Removing conflicting network: $network"
        # Try to remove, but don't fail if it's in use
        docker network rm "$network" 2>/dev/null || echo "⚠️  Could not remove $network (might be in use)"
    else
        echo "ℹ️  Network $network not found (already clean)"
    fi
done

# Set up the shared network
NETWORK_NAME="ytclipper-shared"
SUBNET="172.20.0.0/16"

echo "🔧 Setting up shared Docker network..."

# Remove existing shared network if it exists and recreate it
if docker network ls | grep -q "$NETWORK_NAME"; then
    echo "🗑️  Removing existing shared network to recreate it"
    docker network rm "$NETWORK_NAME" 2>/dev/null || echo "⚠️  Could not remove existing shared network"
fi

echo "🆕 Creating shared network: $NETWORK_NAME"
docker network create \
    --driver bridge \
    --subnet="$SUBNET" \
    "$NETWORK_NAME"

echo "✅ Shared network created successfully"

# Show final network state
echo "📋 Final network state:"
docker network ls
echo "📋 Shared network details:"
docker network inspect "$NETWORK_NAME" --format="{{.Name}}: {{.IPAM.Config}}"

echo "🏁 Network cleanup and setup complete!" 