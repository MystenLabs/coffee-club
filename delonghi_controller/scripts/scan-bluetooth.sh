#!/bin/bash
# Scan for Bluetooth devices using the ble_scanner module

set -e

echo "Scanning for Bluetooth devices..."

# Check if we're using a virtual environment first
if [ -d "venv" ] && [ -f "venv/bin/activate" ]; then
  source venv/bin/activate
  python3.13 -m src.ble_scanner "$@"
else
  # Otherwise run directly with system Python3.13
  python3.13 -m src.ble_scanner "$@"
fi

echo "Scan complete. Use the MAC address of your Delonghi device with the controller."
echo "Example: ./scripts/run-local.sh <MAC_ADDRESS> status" 