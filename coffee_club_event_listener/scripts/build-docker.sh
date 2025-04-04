#!/bin/bash
set -e

echo "Building Coffee Club Event Listener Docker image..."
docker build -t coffee-club-event-listener .

echo "Docker image built successfully!" 