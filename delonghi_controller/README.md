# Delonghi Primadonna Controller

A Python application to control Delonghi Primadonna coffee machines via Bluetooth.

## Requirements

- Python 3.13+
- Bluetooth adapter
- Delonghi Primadonna coffee machine

## Installation

### Build the Docker image


```bash
./scripts/build.sh
```

### Run the application

```bash
./scripts/run.sh <MAC_ADDRESS> [command]
```

### Run the tests

```bash
./scripts/run-tests.sh
```

### Setup the development environment

```bash
./scripts/setup-dev.sh
```

## Commands

Run the application

```bash
python -m src.delonghi_controller <MAC_ADDRESS> [command]
```

Get the status of the coffee machine

```bash
python -m src.delonghi_controller 00:11:22:33:44:55 status
```

Make an espresso

```bash
python -m src.delonghi_controller 00:11:22:33:44:55 espresso
```
