#!/usr/bin/env python3
"""Standalone Delonghi Primadonna Controller"""
import asyncio
import enum
import logging
import uuid
from binascii import hexlify
import platform
import re
import sys

from bleak import BleakClient, BleakScanner
from bleak.exc import BleakDBusError, BleakError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
_LOGGER = logging.getLogger(__name__)

# Constants from the original code
CONTROLL_CHARACTERISTIC = "00035b03-58e6-07dd-021a-08123a000301"
NAME_CHARACTERISTIC = "00002A00-0000-1000-8000-00805F9B34FB"

# Commands
DEBUG = [0x0d, 0x05, 0x75, 0x0f, 0xda, 0x25]
BYTES_POWER = [0x0d, 0x07, 0x84, 0x0f, 0x02, 0x01, 0x55, 0x12]
BYTES_SWITCH_COMMAND = [
    0x0d, 0x0b, 0x90, 0x0f, 0x00, 0x3f,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]
BASE_COMMAND = '10000001'

# Beverage commands
STEAM_ON = [0x0d, 0x0d, 0x83, 0xf0, 0x11, 0x01, 0x09, 0x03, 0x84, 0x1c, 0x01, 0x06, 0xc0, 0x7b]
STEAM_OFF = [0x0d, 0x08, 0x83, 0xf0, 0x11, 0x02, 0x06, 0xde, 0x82]
LONG_ON = [0x0d, 0x0f, 0x83, 0xf0, 0x03, 0x01, 0x01, 0x00, 0xa0, 0x02, 0x03, 0x00, 0x00, 0x06, 0x18, 0x7f]
LONG_OFF = [0x0d, 0x08, 0x83, 0xf0, 0x03, 0x02, 0x06, 0xf3, 0x81]
COFFE_ON = [0x0d, 0x0f, 0x83, 0xf0, 0x02, 0x01, 0x01, 0x00, 0x67, 0x02, 0x02, 0x00, 0x00, 0x06, 0x77, 0xff]
COFFE_OFF = [0x0d, 0x08, 0x83, 0xf0, 0x02, 0x02, 0x06, 0xc4, 0xb1]
DOPPIO_ON = [0x0d, 0x0d, 0x83, 0xf0, 0x05, 0x01, 0x01, 0x00, 0x78, 0x00, 0x00, 0x06, 0xc4, 0x7e]
DOPPIO_OFF = [0x0d, 0x08, 0x83, 0xf0, 0x05, 0x02, 0x06, 0x41, 0x21]
HOTWATER_ON = [0x0d, 0x0d, 0x83, 0xf0, 0x10, 0x01, 0x0f, 0x00, 0xfa, 0x1c, 0x01, 0x06, 0x04, 0xb4]
HOTWATER_OFF = [0x0d, 0x08, 0x83, 0xf0, 0x10, 0x02, 0x06, 0xe9, 0xb2]
ESPRESSO_ON = [0x0d, 0x11, 0x83, 0xf0, 0x01, 0x01, 0x01, 0x00, 0x28, 0x02, 0x03, 0x08, 0x00, 0x00, 0x00, 0x06, 0x8f, 0xfc]
ESPRESSO_OFF = [0x0d, 0x08, 0x83, 0xf0, 0x01, 0x02, 0x06, 0x9d, 0xe1]
AMERICANO_ON = [0x0d, 0x12, 0x83, 0xf0, 0x06, 0x01, 0x01, 0x00, 0x28, 0x02, 0x03, 0x0f, 0x00, 0x6e, 0x00, 0x00, 0x06, 0x47, 0x8b]
AMERICANO_OFF = [0x0d, 0x08, 0x83, 0xf0, 0x06, 0x02, 0x06, 0x18, 0x71]
ESPRESSO2_ON = [0x0d, 0x0f, 0x83, 0xf0, 0x04, 0x01, 0x01, 0x00, 0x28, 0x02, 0x02, 0x00, 0x00, 0x06, 0xab, 0x53]
ESPRESSO2_OFF = [0x0d, 0x08, 0x83, 0xf0, 0x04, 0x02, 0x06, 0x76, 0x11]

# Additional commands
BYTES_AUTOPOWEROFF_COMMAND = [
    0x0d, 0x0b, 0x90, 0x0f, 0x00, 0x3e,
    0x00, 0x00, 0x00, 0x00, 0x81, 0xe3
]

BYTES_WATER_HARDNESS_COMMAND = [
    0x0d, 0x0b, 0x90, 0x0f, 0x00, 0x32,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]

BYTES_WATER_TEMPERATURE_COMMAND = [
    0x0d, 0x0b, 0x90, 0x0f, 0x00, 0x3d,
    0x00, 0x00, 0x00, 0x00, 0x6f, 0x31
]

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

# Status response patterns
DEVICE_READY = [0xd0, 0x12, 0x75, 0x0f, 0x01, 0x05, 0x00, 0x00,
                0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x9d, 0x61]

DEVICE_TURNOFF = [0xd0, 0x12, 0x75, 0x0f, 0x01, 0x01, 0x00, 0x00,
                  0x00, 0x00, 0x03, 0x64, 0x00, 0x00, 0x00, 0x00,
                  0x00, 0xd6, 0x96]

WATER_TANK_DETACHED = [0xd0, 0x12, 0x75, 0x0f, 0x01, 0x15, 0x00, 0x00,
                       0x00, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                       0xaa, 0x31]

WATER_SHORTAGE = [0xd0, 0x12, 0x75, 0x0f, 0x01, 0x45, 0x00, 0x01, 0x00,
                  0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2f, 0x64]

COFFEE_GROUNDS_CONTAINER_DETACHED = [0xd0, 0x12, 0x75, 0x0f, 0x01, 0x0d, 0x00,
                                     0x00, 0x00, 0x07, 0x00, 0x00,
                                     0x00, 0x00, 0x00, 0x00, 0x00, 0x86, 0xc9]

COFFEE_GROUNDS_CONTAINER_FULL = [0xd0, 0x12, 0x75, 0x0f, 0x01, 0x05, 0x00,
                                 0x02, 0x00, 0x07, 0x00, 0x00, 0x00, 0x00,
                                 0x00, 0x00, 0x00, 0x43, 0xd0]

START_COFFEE = [0xd0, 0x12, 0x75, 0x0f, 0x01, 0x05, 0x00, 0x00,
                0x00, 0x07, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x5c, 0xa7]


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
    """Request signer for the new command format"""
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
        _LOGGER.debug("Initializing DelongiPrimadonna with MAC: %s, name: %s", mac, name)
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
        try:
            if (self._client is not None) and self._client.is_connected:
                await self._client.disconnect()
                _LOGGER.debug('Successfully disconnected from %s', self.mac)
            else:
                _LOGGER.debug('No active connection to disconnect from %s', self.mac)
        except Exception as error:
            _LOGGER.warning('Error during disconnect: %s', error)
            # Even if disconnect fails, consider the client disconnected
            self.connected = False
            self._client = None

    async def _connect(self):
        """
        Connect to the device
        :raises BleakError: if the device is not found
        """
        self._connecting = True
        try:
            if (self._client is None) or (not self._client.is_connected):
                # First try to connect directly with the MAC address
                self._device = await BleakScanner.find_device_by_address(self.mac)
                
                if not self._device:
                    _LOGGER.error('Device with address %s not found', self.mac)
                    raise BleakError(
                        f'A device with address {self.mac} could not be found.'
                    )
                    
                self._client = BleakClient(self._device)
                _LOGGER.info('Connect to %s', self.mac)
                await self._client.connect()
                await self._client.start_notify(
                    uuid.UUID(CONTROLL_CHARACTERISTIC), self._handle_data
                )
                self.connected = True
        except Exception as error:
            self._connecting = False
            self.connected = False
            raise error
        self._connecting = False

    def _make_switch_command(self):
        """Make hex command"""
        _LOGGER.debug('Creating switch command with settings - energy_save: %s, cup_light: %s, sounds: %s', 
                     self.switches.energy_save, self.switches.cup_light, self.switches.sounds)
        base_command = list(BASE_COMMAND)
        base_command[3] = '1' if self.switches.energy_save else '0'
        base_command[4] = '1' if self.switches.cup_light else '0'
        base_command[5] = '1' if self.switches.sounds else '0'
        hex_command = BYTES_SWITCH_COMMAND.copy()
        hex_command[9] = int(''.join(base_command), 2)
        _LOGGER.debug('Generated switch command: %s', hexlify(bytearray(hex_command), ' '))
        return hex_command

    async def _handle_data(self, sender, value):
        """Handle data received from the device"""
        _LOGGER.debug('Received raw data from %s: %s', sender, hexlify(value, ' '))
        
        # Handle long format responses (legacy format)
        if len(value) > 9:
            power_state = value[9] > 0
            if power_state != self.switches.is_on:
                _LOGGER.info('Power state changed: %s', 'ON' if power_state else 'OFF')
            self.switches.is_on = power_state
            
        if len(value) > 4:
            new_nozzle_state = NOZZLE_STATE.get(value[4], value[4])
            if new_nozzle_state != self.steam_nozzle:
                _LOGGER.info('Steam nozzle state changed: %s', new_nozzle_state)
            self.steam_nozzle = new_nozzle_state
            
        if len(value) > 7:
            if self.service != value[7]:
                _LOGGER.info('Service value changed: %s', value[7])
            self.service = value[7]
            
        if len(value) > 5:
            new_status = DEVICE_STATUS.get(value[5], DEVICE_STATUS.get(5))
            if new_status != self.status:
                _LOGGER.info('Device status changed: %s', new_status)
            self.status = new_status
        
        # Handle short format responses (3 bytes) - newer format used by this machine
        elif len(value) == 3:
            _LOGGER.debug('Processing 3-byte status response: %s', hexlify(value, ' '))
            
            # Parse first byte (value[0]) for basic status
            if value[0] != 0:
                # Non-zero first byte might indicate the machine is on
                if not self.switches.is_on:
                    _LOGGER.info('Power state changed: ON (inferred from 3-byte response)')
                self.switches.is_on = True
            
            # Parse second byte (value[1]) for operational status
            # The second byte changes significantly between states
            # b5 -> 9c -> c3 suggests different operational modes
            second_byte = value[1]
            
            # Try to infer machine state from second byte patterns
            if second_byte in [0x9c, 0xc3]:  # Values seen during/after hotwater
                if self.status != 'COOKING':
                    _LOGGER.info('Machine status changed: COOKING (inferred from activity)')
                self.status = 'COOKING'
                
                # If we see these patterns, machine is likely active
                if not self.switches.is_on:
                    _LOGGER.info('Power state changed: ON (inferred from activity)')
                self.switches.is_on = True
            elif second_byte == 0xb5:  # Idle state
                if self.status != 'OK':
                    _LOGGER.info('Machine status changed: OK (idle state)')
                self.status = 'OK'
            
            # Parse third byte (value[2]) - might contain additional state info
            # For now, just log it for analysis
            _LOGGER.debug('Third byte value: 0x%02x', value[2])
            
        if self._device_status != hexlify(value, ' '):
            _LOGGER.info('Received data: %s from %s', hexlify(value, ' '), sender)
        self._device_status = hexlify(value, ' ')

    async def power_on(self) -> None:
        """Turn the device on."""
        _LOGGER.info('Sending power on command')
        await self.send_command(BYTES_POWER)

    async def cup_light_on(self) -> None:
        """Turn the cup light on."""
        _LOGGER.info('Turning cup light on')
        self.switches.cup_light = True
        await self.send_command(self._make_switch_command())

    async def cup_light_off(self) -> None:
        """Turn the cup light off."""
        _LOGGER.info('Turning cup light off')
        self.switches.cup_light = False
        await self.send_command(self._make_switch_command())

    async def energy_save_on(self):
        """Enable energy save mode"""
        _LOGGER.info('Enabling energy save mode')
        self.switches.energy_save = True
        await self.send_command(self._make_switch_command())

    async def energy_save_off(self):
        """Enable energy save mode"""
        _LOGGER.info('Disabling energy save mode')
        self.switches.energy_save = False
        await self.send_command(self._make_switch_command())

    async def sound_alarm_on(self):
        """Enable sound alarm"""
        _LOGGER.info('Enabling sound alarm')
        self.switches.sounds = True
        await self.send_command(self._make_switch_command())

    async def sound_alarm_off(self):
        """Disable sound alarm"""
        _LOGGER.info('Disabling sound alarm')
        self.switches.sounds = False
        await self.send_command(self._make_switch_command())

    async def beverage_start(self, beverage: AvailableBeverage) -> None:
        """Start beverage"""
        _LOGGER.info('Starting beverage: %s', beverage)
        self.cooking = beverage
        await self.send_command(BEVERAGE_COMMANDS.get(beverage).on)

    async def beverage_cancel(self) -> None:
        """Cancel beverage"""
        if self.cooking != AvailableBeverage.NONE:
            _LOGGER.info('Cancelling beverage: %s', self.cooking)
            await self.send_command(BEVERAGE_COMMANDS.get(self.cooking).off)
            self.cooking = AvailableBeverage.NONE
        else:
            _LOGGER.debug('No beverage in progress to cancel')

    async def debug(self):
        """Send command which causes status reply"""
        _LOGGER.debug('Sending debug command to request status')
        await self.send_command(DEBUG)

    async def get_device_name(self):
        """
        Get device name
        :return: device name
        """
        try:
            await self._connect()
            try:
                self.hostname = bytes(
                    await self._client.read_gatt_char(uuid.UUID(NAME_CHARACTERISTIC))
                ).decode('utf-8')
                _LOGGER.info('Device name: %s', self.hostname)
            except BleakError as error:
                _LOGGER.warning('Could not read device name: %s', error)
                # Use device address as fallback name
                self.hostname = f"Delonghi_{self.mac.replace(':', '')[-6:]}"
                _LOGGER.info('Using fallback device name: %s', self.hostname)
            
            # Send debug command to request status
            await self._client.write_gatt_char(
                uuid.UUID(CONTROLL_CHARACTERISTIC), bytearray(DEBUG)
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
        _LOGGER.debug('Preparing to send command to %s', self.mac)
        await self._connect()
        try:
            message_copy = message.copy()  # Create a copy to avoid modifying the original
            sign_request(message_copy)
            _LOGGER.info('Sending command: %s', hexlify(bytearray(message_copy), ' '))
            await self._client.write_gatt_char(
                uuid.UUID(CONTROLL_CHARACTERISTIC), bytearray(message_copy)
            )
            _LOGGER.debug('Command sent successfully')
            return True
        except BleakError as error:
            self.connected = False
            _LOGGER.warning('BleakError while sending command: %s', error)
            return False
        except Exception as error:
            self.connected = False
            _LOGGER.error('Unexpected error while sending command: %s', error, exc_info=True)
            return False


async def main():
    """Main function to demonstrate usage"""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python delonghi_controller.py <MAC_ADDRESS> [command] [option]")
        print("Available commands: status, power, espresso, coffee, americano, long, doppio, hotwater, steam, cancel")
        print("For power command, you can specify 'on' or 'off' as an option")
        sys.exit(1)
    
    device_id = sys.argv[1]
    command = sys.argv[2] if len(sys.argv) > 2 else "status"
    option = sys.argv[3] if len(sys.argv) > 3 else None
    
    _LOGGER.info("Starting Delonghi controller with device ID: %s, command: %s, option: %s", 
                device_id, command, option)
    
    # Create the coffee machine controller
    coffee_machine = DelongiPrimadonna(device_id)
    
    try:
        if command == "help":
            print("Usage: python delonghi_controller.py <MAC_ADDRESS> [command] [option]")
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
            print(f"Attempting to connect to device: {device_id}")
            
            # Try to connect and get device name
            connection_attempts = 0
            max_attempts = 3
            while connection_attempts < max_attempts:
                connection_attempts += 1
                try:
                    print(f"Connection attempt {connection_attempts}/{max_attempts}...")
                    name = await coffee_machine.get_device_name()
                    if name:
                        print(f"✓ Connected successfully to: {name}")
                        break
                    else:
                        print("× Connection failed, retrying...")
                        await asyncio.sleep(1)
                except Exception as e:
                    print(f"× Connection error: {e}")
                    if connection_attempts < max_attempts:
                        print("Retrying connection...")
                        await asyncio.sleep(2)
            
            if not coffee_machine.connected:
                print("Failed to connect to the coffee machine after multiple attempts.")
                print("Please check:")
                print("- The MAC address is correct")
                print("- The coffee machine is powered on")
                print("- Bluetooth is enabled on your device")
                print("- You have the necessary permissions (try running with sudo on Linux)")
                return
            
            # Request status update
            print("Requesting device status...")
            await coffee_machine.debug()
            
            # Wait for status updates to be received via notifications
            print("Waiting for status updates (up to 60 seconds)...")
            
            # Wait up to 60 seconds for a response
            max_wait_time = 60  # seconds
            wait_interval = 2   # check every 2 seconds
            waited_time = 0
            
            while waited_time < max_wait_time:
                if coffee_machine._device_status:  # If we've received status data
                    break
                
                # Print a waiting message every 10 seconds
                if waited_time % 10 == 0 and waited_time > 0:
                    print(f"Still waiting for response... ({waited_time} seconds elapsed)")
                
                await asyncio.sleep(wait_interval)
                waited_time += wait_interval
            
            # Only display status information if we received data
            if coffee_machine._device_status:
                print("\n=== COFFEE MACHINE STATUS ===")
                print(f"Device name: {coffee_machine.hostname}")
                print(f"MAC address: {coffee_machine.mac}")
                print(f"Model: {coffee_machine.model}")
                print(f"Power state: {'ON' if coffee_machine.switches.is_on else 'OFF'}")
                print(f"Machine status: {coffee_machine.status}")
                print(f"Steam nozzle state: {coffee_machine.steam_nozzle}")
                print(f"Currently brewing: {coffee_machine.cooking}")
                print(f"Service value: {coffee_machine.service}")
                print("\n=== SETTINGS ===")
                print(f"Cup light: {'ON' if coffee_machine.switches.cup_light else 'OFF'}")
                print(f"Energy save mode: {'ON' if coffee_machine.switches.energy_save else 'OFF'}")
                print(f"Sound alerts: {'ON' if coffee_machine.switches.sounds else 'OFF'}")
                print(f"\nRaw status data: {coffee_machine._device_status}")
            else:
                print("\nNo status data received after waiting 60 seconds.")
                print("The machine may be powered off, in deep sleep mode, or not responding.")
                print("Try sending a power command first: python delonghi_controller.py <MAC_ADDRESS> power")
        
        elif command == "power":
            if option == "off":
                # Power off is not directly supported, but we can cancel any brewing
                await coffee_machine.beverage_cancel()
                print("Cancelled brewing (note: machine may still be powered on)")
            else:
                await coffee_machine.power_on()
                print("Power on command sent")
                # Wait for status update
                await asyncio.sleep(2)
        
        elif command == "espresso":
            await coffee_machine.beverage_start(AvailableBeverage.ESPRESSO)
            print("Making espresso")
            coffee_machine.cooking = AvailableBeverage.ESPRESSO  # Update local state
            # Wait for status update
            await asyncio.sleep(2)
        
        elif command == "coffee":
            await coffee_machine.beverage_start(AvailableBeverage.COFFEE)
            print("Making coffee")
            coffee_machine.cooking = AvailableBeverage.COFFEE  # Update local state
            # Wait for status update
            await asyncio.sleep(2)
        
        elif command == "americano":
            await coffee_machine.beverage_start(AvailableBeverage.AMERICANO)
            print("Making americano")
            coffee_machine.cooking = AvailableBeverage.AMERICANO  # Update local state
            # Wait for status update
            await asyncio.sleep(2)
        
        elif command == "long":
            await coffee_machine.beverage_start(AvailableBeverage.LONG)
            print("Making long coffee")
            coffee_machine.cooking = AvailableBeverage.LONG  # Update local state
            # Wait for status update
            await asyncio.sleep(2)
        
        elif command == "doppio":
            await coffee_machine.beverage_start(AvailableBeverage.DOPIO)
            print("Making doppio")
            coffee_machine.cooking = AvailableBeverage.DOPIO  # Update local state
            # Wait for status update
            await asyncio.sleep(2)
        
        elif command == "hotwater":
            await coffee_machine.beverage_start(AvailableBeverage.HOTWATER)
            print("Dispensing hot water")
            coffee_machine.cooking = AvailableBeverage.HOTWATER  # Update local state
            # Wait for status update
            await asyncio.sleep(2)
        
        elif command == "steam":
            await coffee_machine.beverage_start(AvailableBeverage.STEAM)
            print("Activating steam")
            coffee_machine.cooking = AvailableBeverage.STEAM  # Update local state
            # Wait for status update
            await asyncio.sleep(2)
        
        elif command == "cancel":
            await coffee_machine.beverage_cancel()
            print("Cancelled brewing")
            coffee_machine.cooking = AvailableBeverage.NONE  # Update local state
            # Wait for status update
            await asyncio.sleep(2)
        
        else:
            print(f"Unknown command: {command}")
            print("Available commands: status, power, espresso, coffee, americano, long, doppio, hotwater, steam, cancel")
            print("Use 'help' command for more information")
    
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        print("Use 'help' command for usage information")
    
    finally:
        print("Disconnecting from coffee machine...")
        await coffee_machine.disconnect()
        print("Disconnected")


if __name__ == "__main__":
    # Set higher log level for debugging if needed
    if len(sys.argv) > 1 and sys.argv[1] == "--debug":
        logging.getLogger().setLevel(logging.DEBUG)
        logging.getLogger('bleak').setLevel(logging.DEBUG)
        sys.argv.pop(1)  # Remove the debug flag
        
    asyncio.run(main())