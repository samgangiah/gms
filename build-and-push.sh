#!/bin/bash
set -e

# Build and push Docker image to Docker Hub
# Run this on your LOCAL machine, not VPS

echo "🏗️  Building and Pushing Gilnokie GMS to Docker Hub"
echo "=================================================="
echo ""

# Configuration
DOCKER_USERNAME="samgfls"  # Your Docker Hub username
IMAGE_NAME="gilnokie-gms"
VERSION=$(date +%Y%m%d-%H%M%S)
LATEST_TAG="latest"

echo "📦 Image: $DOCKER_USERNAME/$IMAGE_NAME"
echo "🏷️  Tags: $VERSION, $LATEST_TAG"
echo ""

# Check if logged in to Docker Hub
echo "🔐 Checking Docker Hub authentication..."
if ! docker info | grep -q "Username: $DOCKER_USERNAME"; then
    echo "⚠️  Not logged in to Docker Hub"
    echo "Please run: docker login"
    echo ""
    read -p "Press Enter after logging in..."
fi

# Build the image
echo "🔨 Building Docker image..."
cd gilnokie-app
docker build \
    --platform linux/amd64 \
    -t $DOCKER_USERNAME/$IMAGE_NAME:$VERSION \
    -t $DOCKER_USERNAME/$IMAGE_NAME:$LATEST_TAG \
    .

echo "✅ Build complete!"
echo ""

# Push to Docker Hub
echo "⬆️  Pushing to Docker Hub..."
docker push $DOCKER_USERNAME/$IMAGE_NAME:$VERSION
docker push $DOCKER_USERNAME/$IMAGE_NAME:$LATEST_TAG

echo ""
echo "✅ Successfully pushed to Docker Hub!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Next steps on your VPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Update docker-compose.yml to use pre-built image:"
echo "   Replace the 'build:' section with:"
echo "   image: $DOCKER_USERNAME/$IMAGE_NAME:$LATEST_TAG"
echo ""
echo "2. Pull and start:"
echo "   docker compose pull"
echo "   docker compose up -d"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Done! Your image is available at:"
echo "   https://hub.docker.com/r/$DOCKER_USERNAME/$IMAGE_NAME"
echo ""
