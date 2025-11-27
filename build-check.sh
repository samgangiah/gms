#!/bin/bash

# Script to monitor Docker build progress
# Run this on VPS to check what's happening during build

echo "🔍 Checking Docker build status..."
echo ""

# Check if build is running
BUILD_CONTAINER=$(docker ps -a | grep "gilnokie-app" | grep -v "Up" | head -1)

if [ ! -z "$BUILD_CONTAINER" ]; then
    CONTAINER_ID=$(echo $BUILD_CONTAINER | awk '{print $1}')
    echo "📦 Found build container: $CONTAINER_ID"
    echo ""
    echo "📋 Recent build logs:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    docker logs --tail 50 $CONTAINER_ID 2>&1
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "⚠️  No build container found"
    echo ""
    echo "Checking docker compose build process..."
    docker compose ps
fi

echo ""
echo "💾 System Resources:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Memory:"
free -h
echo ""
echo "Disk:"
df -h /
echo ""
echo "CPU Load:"
uptime
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "💡 Tips:"
echo "  - If memory is low (<1GB free), build may be swapping"
echo "  - If disk is >90% full, build may fail"
echo "  - Check live logs: docker compose logs -f app"
echo "  - Cancel and restart: Ctrl+C then docker compose down && docker compose build --no-cache"
