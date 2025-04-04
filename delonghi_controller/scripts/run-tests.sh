#!/bin/bash
# Run the unit tests for the Delonghi controller

set -e

# Check if a specific test was specified
if [ $# -eq 0 ]; then
  echo "Running all tests..."
  docker run --rm -it \
    --entrypoint python \
    delonghi-controller \
    -m unittest discover -s tests
else
  echo "Running specific test: $1"
  docker run --rm -it \
    --entrypoint python \
    delonghi-controller \
    -m unittest tests.$1
fi

echo "Tests completed." 