"""
Scan/Discovery
--------------

Example showing how to scan for BLE devices using Bleak. This script helps you
discover the MAC address (or Bluetooth address) of nearby BLE devices, including
the Delonghi Primadonna coffee machine.

Usage:
    python ble_scanner.py --services <uuid> [...optional uuids...]
    python ble_scanner.py --macos-use-bdaddr

Use the returned MAC/Bluetooth address in conjunction with the Delonghi controller.
"""

import argparse
import asyncio

from bleak import BleakScanner


async def main(args: argparse.Namespace):
    print("Scanning for 5 seconds, please wait...")

    devices = await BleakScanner.discover(
        return_adv=True,
        service_uuids=args.services,
        cb=dict(use_bdaddr=args.macos_use_bdaddr),
    )

    for device, advertisement_data in devices.values():
        print()
        print(device)
        print("-" * len(str(device)))
        print(advertisement_data)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--services",
        metavar="<uuid>",
        nargs="*",
        help="UUID(s) of one or more services to filter for",
    )

    parser.add_argument(
        "--macos-use-bdaddr",
        action="store_true",
        help="When true, use the Bluetooth device address instead of UUID on macOS",
    )

    args = parser.parse_args()

    asyncio.run(main(args)) 