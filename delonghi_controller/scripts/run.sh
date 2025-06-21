#!/bin/bash
# Run the Delonghi controller with the specified arguments

set -e

if [ $# -lt 1 ]; then
  echo "Usage: $0 <MAC_ADDRESS> [command] [option]"
  echo "Example: $0 00:11:22:33:44:55 status"
  echo "Example: $0 00:11:22:33:44:55 espresso"
  exit 1
fi

MAC_ADDRESS=$1
COMMAND=${2:-status}
OPTION=$3

echo "Running Delonghi controller for device $MAC_ADDRESS..."
echo "Command: $COMMAND"
if [ ! -z "$OPTION" ]; then
  echo "Option: $OPTION"
  docker run --rm -it \
    --network host \
    --privileged \
    delonghi-controller \
    "$MAC_ADDRESS" "$COMMAND" "$OPTION"
else
  docker run --rm -it \
    --network host \
    --privileged \
    delonghi-controller \
    "$MAC_ADDRESS" "$COMMAND"
fi 