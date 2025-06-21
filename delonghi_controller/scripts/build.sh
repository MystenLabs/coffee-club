#!/bin/bash
# Build the Docker image for the Delonghi controller

set -e

echo "Building Delonghi controller Docker image..."
docker build -t delonghi-controller .

echo "Build complete! You can now run the controller or tests."
echo "Example: ./scripts/run-tests.sh"
echo "Example: ./scripts/run.sh <MAC_ADDRESS> status"