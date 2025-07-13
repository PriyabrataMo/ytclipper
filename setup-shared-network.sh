#!/bin/bash

set -e

NETWORK_NAME="ytclipper-shared"
SUBNET="172.20.0.0/16"

echo "🔧 Setting up shared Docker network for YTClipper deployments..."

# Check if network already exists
if docker network ls | grep -q "$NETWORK_NAME"; then
    echo "✅ Network '$NETWORK_NAME' already exists"
    docker network inspect "$NETWORK_NAME"
else
    echo "🆕 Creating network '$NETWORK_NAME' with subnet $SUBNET"
    docker network create \
        --driver bridge \
        --subnet="$SUBNET" \
        "$NETWORK_NAME"
    echo "✅ Network '$NETWORK_NAME' created successfully"
fi

echo "📋 Network details:"
docker network inspect "$NETWORK_NAME" --format="{{.Name}}: {{.IPAM.Config}}"

echo "🏁 Shared network setup complete!" 