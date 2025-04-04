#!/usr/bin/env python3
"""Standalone Delonghi Primadonna Controller"""
import asyncio
import enum
import logging
import uuid
from binascii import hexlify
import platform

from bleak import BleakClient, BleakScanner
from bleak.exc import BleakDBusError, BleakError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
_LOGGER = logging.getLogger(__name__)

# Constants from the original code
CONTROLL_CHARACTERISTIC = "00035b03-58e6-07dd-021a-08123a000300"
NAME_CHARACTERISTIC = "00002a00-0000-1000-8000-00805f9b34fb"

# Commands
DEBUG = [0xD0, 0x12, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
BYTES_POWER = [0xD0, 0x12, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
BYTES_SWITCH_COMMAND = [0xD0, 0x12, 0x32, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
BASE_COMMAND = ['0', '0', '0', '0', '0', '0', '0', '0']

# Beverage commands
STEAM_ON = [0xD0, 0x12, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
STEAM_OFF = [0xD0, 0x12, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
LONG_ON = [0xD0, 0x12, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
LONG_OFF = [0xD0, 0x12, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
COFFE_ON = [0xD0, 0x12, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
COFFE_OFF = [0xD0, 0x12, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
DOPPIO_ON = [0xD0, 0x12, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
DOPPIO_OFF = [0xD0, 0x12, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
HOTWATER_ON = [0xD0, 0x12, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
HOTWATER_OFF = [0xD0, 0x12, 0x05, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
ESPRESSO_ON = [0xD0, 0x12, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
ESPRESSO_OFF = [0xD0, 0x12, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
AMERICANO_ON = [0xD0, 0x12, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
AMERICANO_OFF = [0xD0, 0x12, 0x09, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
ESPRESSO2_ON = [0xD0, 0x12, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
ESPRESSO2_OFF = [0xD0, 0x12, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]

# Status codes
NOZZLE_STATE = {
    -1: 'UNKNOWN',
    0: 'DETACHED',
    1: 'STEAM',
    2: 'MILK_FROTHER',
    4: 'MILK_FROTHER_CLEANING',
}

DEVICE_STATUS = {
    3: 'COOKING',
    4: 'NOZZLE_DETACHED',
    5: 'OK',
    13: 'COFFEE_GROUNDS_CONTAINER_DETACHED',
    21: 'WATER_TANK_DETACHED',
}


class AvailableBeverage(enum.StrEnum):
    """Coffee machine available beverages"""
    NONE = 'none'
    STEAM = 'steam'
    LONG = 'long'
    COFFEE = 'coffee'
    DOPIO = 'dopio'
    HOTWATER = 'hot_water'
    ESPRESSO = 'espresso'
    AMERICANO = 'americano'
    ESPRESSO2 = 'espresso2'


class BeverageCommand:
    """Coffee machine beverage commands"""
    def __init__(self, on, off):
        self.on = on
        self.off = off


class DeviceSwitches:
    """All binary switches for the device"""
    def __init__(self):
        self.sounds = False
        self.energy_save = False
        self.cup_light = False
        self.filter = False
        self.is_on = False


BEVERAGE_COMMANDS = {
    AvailableBeverage.NONE: BeverageCommand(DEBUG, DEBUG),
    AvailableBeverage.STEAM: BeverageCommand(STEAM_ON, STEAM_OFF),
    AvailableBeverage.LONG: BeverageCommand(LONG_ON, LONG_OFF),
    AvailableBeverage.COFFEE: BeverageCommand(COFFE_ON, COFFE_OFF),
    AvailableBeverage.DOPIO: BeverageCommand(DOPPIO_ON, DOPPIO_OFF),
    AvailableBeverage.HOTWATER: BeverageCommand(HOTWATER_ON, HOTWATER_OFF),
    AvailableBeverage.ESPRESSO: BeverageCommand(ESPRESSO_ON, ESPRESSO_OFF),
    AvailableBeverage.AMERICANO: BeverageCommand(AMERICANO_ON, AMERICANO_OFF),
    AvailableBeverage.ESPRESSO2: BeverageCommand(ESPRESSO2_ON, ESPRESSO2_OFF),
}


def sign_request(message):
    """Request signer"""
    deviser = 0x1D0F
    for item in message[: len(message) - 2]:
        i3 = (((deviser << 8) | (deviser >> 8)) & 0x0000FFFF) ^ (item & 0xFFFF)
        i4 = i3 ^ ((i3 & 0xFF) >> 4)
        i5 = i4 ^ ((i4 << 12) & 0x0000FFFF)
        deviser = i5 ^ (((i5 & 0xFF) << 5) & 0x0000FFFF)
    signature = list((deviser & 0x0000FFFF).to_bytes(2, byteorder='big'))
    message[len(message) - 2] = signature[0]
    message[len(message) - 1] = signature[1]
    return message


class DelongiPrimadonna:
    """Delongi Primadonna standalone class"""

    def __init__(self, mac, name="Delonghi Coffee Machine"):
        """Initialize device"""
        self._device_status = None
        self._client = None
        self._device = None
        self._connecting = False
        self.mac = mac
        self.name = name
        self.hostname = ''
        self.model = 'Prima Donna'
        self.cooking = AvailableBeverage.NONE
        self.connected = False
        self.steam_nozzle = NOZZLE_STATE[-1]
        self.service = 0
        self.status = DEVICE_STATUS[5]
        self.switches = DeviceSwitches()

    async def disconnect(self):
        """Disconnect from the device"""
        _LOGGER.info('Disconnect from %s', self.mac)
        if (self._client is not None) and self._client.is_connected:
            await self._client.disconnect()

    async def _connect(self):
        """
        Connect to the device
        :raises BleakError: if the device is not found
        """
        self._connecting = True
        try:
            if (self._client is None) or (not self._client.is_connected):
                self._device = await BleakScanner.find_device_by_address(self.mac)
                if not self._device:
                    raise BleakError(
                        f'A device with address {self.mac} could not be found.'
                    )
                self._client = BleakClient(self._device)
                _LOGGER.info('Connect to %s', self.mac)
                await self._client.connect()
                await self._client.start_notify(
                    CONTROLL_CHARACTERISTIC, self._handle_data
                )
                self.connected = True
        except Exception as error:
            self._connecting = False
            self.connected = False
            raise error
        self._connecting = False

    def _make_switch_command(self):
        """Make hex command"""
        base_command = list(BASE_COMMAND)
        base_command[3] = '1' if self.switches.energy_save else '0'
        base_command[4] = '1' if self.switches.cup_light else '0'
        base_command[5] = '1' if self.switches.sounds else '0'
        hex_command = BYTES_SWITCH_COMMAND.copy()
        hex_command[9] = int(''.join(base_command), 2)
        return hex_command

    async def _handle_data(self, sender, value):
        """Handle data received from the device"""
        if len(value) > 9:
            self.switches.is_on = value[9] > 0
        if len(value) > 4:
            self.steam_nozzle = NOZZLE_STATE.get(value[4], value[4])
        if len(value) > 7:
            self.service = value[7]
        if len(value) > 5:
            self.status = DEVICE_STATUS.get(value[5], DEVICE_STATUS.get(5))
        if self._device_status != hexlify(value, ' '):
            _LOGGER.info('Received data: %s from %s', hexlify(value, ' '), sender)
        self._device_status = hexlify(value, ' ')

    async def power_on(self) -> None:
        """Turn the device on."""
        await self.send_command(BYTES_POWER)

    async def cup_light_on(self) -> None:
        """Turn the cup light on."""
        self.switches.cup_light = True
        await self.send_command(self._make_switch_command())

    async def cup_light_off(self) -> None:
        """Turn the cup light off."""
        self.switches.cup_light = False
        await self.send_command(self._make_switch_command())

    async def energy_save_on(self):
        """Enable energy save mode"""
        self.switches.energy_save = True
        await self.send_command(self._make_switch_command())

    async def energy_save_off(self):
        """Enable energy save mode"""
        self.switches.energy_save = False
        await self.send_command(self._make_switch_command())

    async def sound_alarm_on(self):
        """Enable sound alarm"""
        self.switches.sounds = True
        await self.send_command(self._make_switch_command())

    async def sound_alarm_off(self):
        """Disable sound alarm"""
        self.switches.sounds = False
        await self.send_command(self._make_switch_command())

    async def beverage_start(self, beverage: AvailableBeverage) -> None:
        """Start beverage"""
        self.cooking = beverage
        await self.send_command(BEVERAGE_COMMANDS.get(beverage).on)

    async def beverage_cancel(self) -> None:
        """Cancel beverage"""
        if self.cooking != AvailableBeverage.NONE:
            await self.send_command(BEVERAGE_COMMANDS.get(self.cooking).off)
            self.cooking = AvailableBeverage.NONE

    async def debug(self):
        """Send command which causes status reply"""
        await self.send_command(DEBUG)

    async def get_device_name(self):
        """
        Get device name
        :return: device name
        """
        try:
            await self._connect()
            self.hostname = bytes(
                await self._client.read_gatt_char(NAME_CHARACTERISTIC)
            ).decode('utf-8')
            await self._client.write_gatt_char(
                CONTROLL_CHARACTERISTIC, bytearray(DEBUG)
            )
            self.connected = True
            return self.hostname
        except BleakDBusError as error:
            self.connected = False
            _LOGGER.warning('BleakDBusError: %s', error)
        except BleakError as error:
            self.connected = False
            _LOGGER.warning('BleakError: %s', error)
        except asyncio.exceptions.TimeoutError as error:
            self.connected = False
            _LOGGER.info('TimeoutError: %s at device connection', error)
        except asyncio.exceptions.CancelledError as error:
            self.connected = False
            _LOGGER.warning('CancelledError: %s', error)
        return None

    async def send_command(self, message):
        """Send command to the device"""
        await self._connect()
        try:
            message_copy = message.copy()  # Create a copy to avoid modifying the original
            sign_request(message_copy)
            _LOGGER.info('Send command: %s', hexlify(bytearray(message_copy), ' '))
            await self._client.write_gatt_char(
                CONTROLL_CHARACTERISTIC, bytearray(message_copy)
            )
            return True
        except BleakError as error:
            self.connected = False
            _LOGGER.warning('BleakError: %s', error)
            return False


async def main():
    """Main function to demonstrate usage"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python delonghi_controller.py <MAC_ADDRESS_OR_UUID> [command] [option]")
        print("Available commands: status, power, espresso, coffee, americano, long, doppio, hotwater, steam, cancel")
        print("For power command, you can specify 'on' or 'off' as an option")
        sys.exit(1)
    
    device_id = sys.argv[1]
    command = sys.argv[2] if len(sys.argv) > 2 else "status"
    option = sys.argv[3] if len(sys.argv) > 3 else None
    
    # Create the coffee machine controller
    coffee_machine = DelongiPrimadonna(device_id)
    
    try:
        if command == "help":
            print("Usage: python delonghi_controller.py <MAC_ADDRESS_OR_UUID> [command] [option]")
            print("Available commands:")
            print("  status    - Get the current status of the coffee machine")
            print("  power     - Toggle power (use 'on' or 'off' as option)")
            print("  espresso  - Make an espresso")
            print("  coffee    - Make a coffee")
            print("  americano - Make an americano")
            print("  long      - Make a long coffee")
            print("  doppio    - Make a doppio")
            print("  hotwater  - Dispense hot water")
            print("  steam     - Activate steam")
            print("  cancel    - Cancel current brewing")
            return
            
        elif command == "status":
            name = await coffee_machine.get_device_name()
            print(f"Device name: {name}")
            await coffee_machine.debug()  # Request status update
            await asyncio.sleep(1)  # Wait for status to be received
            print(f"Power: {'ON' if coffee_machine.switches.is_on else 'OFF'}")
            print(f"Status: {coffee_machine.status}")
            print(f"Steam nozzle: {coffee_machine.steam_nozzle}")
            print(f"Currently brewing: {coffee_machine.cooking}")
        
        elif command == "power":
            if option == "off":
                # Power off is not directly supported, but we can cancel any brewing
                await coffee_machine.beverage_cancel()
                print("Cancelled brewing (note: machine may still be powered on)")
            else:
                await coffee_machine.power_on()
                print("Power on command sent")
        
        elif command == "espresso":
            await coffee_machine.beverage_start(AvailableBeverage.ESPRESSO)
            print("Making espresso")
        
        elif command == "coffee":
            await coffee_machine.beverage_start(AvailableBeverage.COFFEE)
            print("Making coffee")
        
        elif command == "americano":
            await coffee_machine.beverage_start(AvailableBeverage.AMERICANO)
            print("Making americano")
        
        elif command == "long":
            await coffee_machine.beverage_start(AvailableBeverage.LONG)
            print("Making long coffee")
        
        elif command == "doppio":
            await coffee_machine.beverage_start(AvailableBeverage.DOPIO)
            print("Making doppio")
        
        elif command == "hotwater":
            await coffee_machine.beverage_start(AvailableBeverage.HOTWATER)
            print("Dispensing hot water")
        
        elif command == "steam":
            await coffee_machine.beverage_start(AvailableBeverage.STEAM)
            print("Activating steam")
        
        elif command == "cancel":
            await coffee_machine.beverage_cancel()
            print("Cancelled brewing")
        
        else:
            print(f"Unknown command: {command}")
            print("Available commands: status, power, espresso, coffee, americano, long, doppio, hotwater, steam, cancel")
            print("Use 'help' command for more information")
    
    except Exception as e:
        print(f"Error: {e}")
        print("Use 'help' command for usage information")
    
    finally:
        await coffee_machine.disconnect()


if __name__ == "__main__":
    asyncio.run(main())