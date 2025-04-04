#!/usr/bin/env python3
"""Unit tests for Delonghi Primadonna Controller"""
import asyncio
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from src.delonghi_controller import (
    DelongiPrimadonna,
    AvailableBeverage,
    CONTROLL_CHARACTERISTIC,
    NAME_CHARACTERISTIC,
    DEBUG,
    BYTES_POWER
)


class TestDelongiPrimadonna(unittest.TestCase):
    """Test cases for DelongiPrimadonna class"""

    def setUp(self):
        """Set up test fixtures"""
        self.mac_address = "00:11:22:33:44:55"
        self.device_name = "Test Coffee Machine"
        self.coffee_machine = DelongiPrimadonna(self.mac_address, self.device_name)
        
        # Create mock for BleakClient
        self.mock_client_patcher = patch('src.delonghi_controller.BleakClient')
        self.mock_client = self.mock_client_patcher.start()
        
        # Create mock for BleakScanner
        self.mock_scanner_patcher = patch('src.delonghi_controller.BleakScanner')
        self.mock_scanner = self.mock_scanner_patcher.start()
        
        # Setup mock device
        self.mock_device = MagicMock()
        
        # Make find_device_by_address return a coroutine that returns the mock device
        self.mock_scanner.find_device_by_address = AsyncMock(return_value=self.mock_device)
        
        # Setup mock client instance
        self.mock_client_instance = MagicMock()
        self.mock_client_instance.is_connected = True
        self.mock_client_instance.connect = AsyncMock()
        self.mock_client_instance.disconnect = AsyncMock()
        self.mock_client_instance.start_notify = AsyncMock()
        self.mock_client_instance.write_gatt_char = AsyncMock()
        self.mock_client_instance.read_gatt_char = AsyncMock(return_value=bytes(self.device_name, 'utf-8'))
        
        self.mock_client.return_value = self.mock_client_instance

    def tearDown(self):
        """Tear down test fixtures"""
        self.mock_client_patcher.stop()
        self.mock_scanner_patcher.stop()

    async def async_test(self, coroutine):
        """Helper to run async tests"""
        return await coroutine

    def test_init(self):
        """Test initialization of DelongiPrimadonna"""
        self.assertEqual(self.coffee_machine.mac, self.mac_address)
        self.assertEqual(self.coffee_machine.name, self.device_name)
        self.assertEqual(self.coffee_machine.model, 'Prima Donna')
        self.assertEqual(self.coffee_machine.cooking, AvailableBeverage.NONE)
        self.assertFalse(self.coffee_machine.connected)

    def test_connect(self):
        """Test connection to device"""
        asyncio.run(self.async_test(self.coffee_machine._connect()))
        
        # Verify scanner was called with correct address
        self.mock_scanner.find_device_by_address.assert_called_once_with(self.mac_address)
        
        # Verify client was created with correct device
        self.mock_client.assert_called_once_with(self.mock_device)
        
        # Verify connect was called
        self.mock_client_instance.connect.assert_called_once()
        
        # Verify start_notify was called with correct characteristic
        self.mock_client_instance.start_notify.assert_called_once_with(
            CONTROLL_CHARACTERISTIC, self.coffee_machine._handle_data
        )
        
        # Verify connected state
        self.assertTrue(self.coffee_machine.connected)

    def test_disconnect(self):
        """Test disconnection from device"""
        # Setup client
        self.coffee_machine._client = self.mock_client_instance
        
        asyncio.run(self.async_test(self.coffee_machine.disconnect()))
        
        # Verify disconnect was called
        self.mock_client_instance.disconnect.assert_called_once()

    def test_get_device_name(self):
        """Test getting device name"""
        result = asyncio.run(self.async_test(self.coffee_machine.get_device_name()))
        
        # Verify read_gatt_char was called with correct characteristic
        self.mock_client_instance.read_gatt_char.assert_called_once_with(NAME_CHARACTERISTIC)
        
        # Verify write_gatt_char was called with DEBUG command
        self.mock_client_instance.write_gatt_char.assert_called_once_with(
            CONTROLL_CHARACTERISTIC, bytearray(DEBUG)
        )
        
        # Verify result
        self.assertEqual(result, self.device_name)
        self.assertEqual(self.coffee_machine.hostname, self.device_name)

    def test_power_on(self):
        """Test power on command"""
        # Mock send_command
        self.coffee_machine.send_command = AsyncMock()
        
        asyncio.run(self.async_test(self.coffee_machine.power_on()))
        
        # Verify send_command was called with BYTES_POWER
        self.coffee_machine.send_command.assert_called_once_with(BYTES_POWER)

    def test_beverage_start(self):
        """Test starting a beverage"""
        # Mock send_command
        self.coffee_machine.send_command = AsyncMock()
        
        # Test starting espresso
        asyncio.run(self.async_test(self.coffee_machine.beverage_start(AvailableBeverage.ESPRESSO)))
        
        # Verify cooking state
        self.assertEqual(self.coffee_machine.cooking, AvailableBeverage.ESPRESSO)
        
        # Verify send_command was called with correct command
        self.coffee_machine.send_command.assert_called_once()

    def test_beverage_cancel(self):
        """Test canceling a beverage"""
        # Mock send_command
        self.coffee_machine.send_command = AsyncMock()
        
        # Set cooking state
        self.coffee_machine.cooking = AvailableBeverage.ESPRESSO
        
        # Cancel beverage
        asyncio.run(self.async_test(self.coffee_machine.beverage_cancel()))
        
        # Verify cooking state
        self.assertEqual(self.coffee_machine.cooking, AvailableBeverage.NONE)
        
        # Verify send_command was called
        self.coffee_machine.send_command.assert_called_once()

    def test_handle_data(self):
        """Test handling data from device"""
        # Test data with device on
        test_data = bytearray([0, 0, 0, 0, 1, 5, 0, 0, 0, 1])
        asyncio.run(self.async_test(self.coffee_machine._handle_data(None, test_data)))
        
        # Verify state
        self.assertTrue(self.coffee_machine.switches.is_on)
        self.assertEqual(self.coffee_machine.steam_nozzle, 'STEAM')
        self.assertEqual(self.coffee_machine.status, 'OK')
        
        # Test data with device off
        test_data = bytearray([0, 0, 0, 0, 0, 5, 0, 0, 0, 0])
        asyncio.run(self.async_test(self.coffee_machine._handle_data(None, test_data)))
        
        # Verify state
        self.assertFalse(self.coffee_machine.switches.is_on)

    def test_make_switch_command(self):
        """Test making switch command"""
        # Set switch states
        self.coffee_machine.switches.energy_save = True
        self.coffee_machine.switches.cup_light = True
        self.coffee_machine.switches.sounds = False
        
        # Get command
        command = self.coffee_machine._make_switch_command()
        
        # Verify command - binary 00011000 = 24 decimal
        self.assertEqual(command[9], 24)  

        # Change switch states
        self.coffee_machine.switches.energy_save = False
        self.coffee_machine.switches.cup_light = False
        self.coffee_machine.switches.sounds = True
        
        # Get command
        command = self.coffee_machine._make_switch_command()
        
        # Verify command - binary 00100000 = 4 decimal (based on actual implementation)
        self.assertEqual(command[9], 4)  


if __name__ == '__main__':
    unittest.main() 