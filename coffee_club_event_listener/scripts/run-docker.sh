#!/bin/bash
set -e

# Default values
ENV_FILE=".env"
source $ENV_FILE
CONTAINER_NAME="coffee-club-event-listener"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --port=*)
      PORT="${1#*=}"
      shift
      ;;
    --env-file=*)
      ENV_FILE="${1#*=}"
      shift
      ;;
    --name=*)
      CONTAINER_NAME="${1#*=}"
      shift
      ;;
    *)
      echo "Unknown parameter: $1"
      exit 1
      ;;
  esac
done

echo "Running Coffee Club Event Listener Docker container..."
echo "Port: $PORT"
echo "Environment file: $ENV_FILE"
echo "Container name: $CONTAINER_NAME"

# Check if container with the same name exists
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
  echo "Container with name $CONTAINER_NAME already exists. Removing it..."
  docker rm -f $CONTAINER_NAME
fi

# Run the container
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:$PORT \
  --env-file $ENV_FILE \
  coffee-club-event-listener

echo "Container started successfully!"
echo "To view logs: docker logs -f $CONTAINER_NAME" 