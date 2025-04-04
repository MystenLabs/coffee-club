# Coffee Club Event Listener


This service listens to events emitted by the Coffee Club smart contract on the Sui blockchain and indexes them into a database for easy querying and display in the frontend application.

## Overview
The Coffee Club Event Listener is responsible for:
* Tracking specific events from the Coffee Club smart contract
* Processing these events and storing relevant data in a database
* Maintaining cursor positions to ensure no events are missed
* Providing resilience through error handling and retry mechanisms

## Events Tracked
The service currently tracks the following events:
* `CafeCreated`: Triggered when a new cafe is created
* `CoffeeOrderCreated`: Triggered when a new coffee order is placed
* `CoffeeOrderUpdated`: Triggered when an existing coffee order is updated

## Architecture
The event listener follows a modular architecture:
* Event Indexer: Core component that polls the Sui blockchain for events
* Event Handlers: Specialized handlers for different event types
* Database Layer: Persists event data and cursor positions
* Configuration: Environment-specific settings

## Setup and Configuration

### Prerequisites
- Node.js (v16+)
- PostgreSQL database
- Access to a Sui RPC endpoint

### Environment Variables
Create a .env file with the following variables:

```bash
SUI_NETWORK=testnet
PACKAGE_ID=0x... # Replace with your actual package ID
POLLING_INTERVAL_MS=30000
```

## How It Works

The service initializes by setting up event listeners for each tracked event

For each event type, it retrieves the last processed cursor from the database

It polls the Sui blockchain for new events, starting from the saved cursor

When events are found, they are processed by the appropriate handler

The cursor position is updated in the database

The process repeats, with configurable polling intervals


## Development

### Project Structure

```
coffee_club_event_listener/
├── src/
│   ├── config.ts            # Configuration settings
│   ├── db.ts                # Database connection
│   ├── sui-utils.ts         # Sui blockchain utilities
│   ├── indexer/
│   │   ├── event-indexer.ts # Main indexer logic
│   │   ├── cafe-handler.ts  # Handler for cafe events
│   │   └── order-handler.ts # Handler for order events
│   └── index.ts             # Entry point
├── prisma/
│   └── schema.prisma        # Database schema
└── package.json
```

### Adding New Event Types

To track additional events:

1. Add a new entry to the `EVENTS_TO_TRACK` array in `event-indexer.ts`
2. Create a handler function for the new event type
3. Update the database schema if necessary

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```


## Resources

* [Trustless Swap Demo](https://docs.sui.io/guides/developer/app-examples/trustless-swap#backend)