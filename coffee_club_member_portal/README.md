# Coffee Club Member Portal

## Overview
The Coffee Club Member Portal is a decentralized application (dApp) built on the Sui blockchain that allows users to join a coffee club, order coffee from partner cafes, and manage their orders. The application features role-based access control with different capabilities for members, cafe managers, and administrators.

## Features

### For Members
- Create a membership to join the Coffee Club
- Browse available partner cafes
- Place coffee orders at selected cafes
- View order history and status updates

### For Cafe Managers
- Create and manage cafe profiles
- Process incoming coffee orders
- Update order statuses (processing, completed, cancelled)
- Track order history for their cafe

### For Administrators
- Add new cafe managers to the system
- View system-wide statistics
- Manage the overall Coffee Club platform

## Technical Implementation
The application is built using:
- React with TypeScript for the frontend
- Sui blockchain for the backend smart contracts
- @mysten/dapp-kit for wallet connection and blockchain interaction

The smart contract package handles:
- Membership creation and management
- Cafe registration and management
- Order processing and status updates
- Role-based capability management

## Getting Started
1. Clone the repository
2. Install dependencies with `pnpm install`
3. Start the development server with `pnpm run dev`
4. Connect your Sui wallet to interact with the application

## Usage Flow
1. **Connect Wallet**: Use the Connect button in the top-right corner to connect your Sui wallet
2. **Create Membership**: If you're a new user, create a membership to join the Coffee Club
3. **Order Coffee**: Browse available cafes and place an order
4. **Track Orders**: View your order history and status updates

## Role Management
- **Members**: Any user who creates a membership
- **Cafe Managers**: Users who have been granted a CoffeeClubManager capability by an admin
- **Administrators**: Users who possess the CoffeeClubCap capability

## Smart Contract Integration
The application interacts with the following smart contract functions:
- `create_member`: Creates a new Coffee Club membership
- `order_coffee`: Places a new coffee order at a selected cafe
- `update_coffee_order`: Updates the status of an existing order
- `add_manager`: Grants cafe manager capabilities to a user
- `create_cafe`: Creates a new cafe profile

## Development
The application uses the constants defined in `constants.ts` to connect to the deployed smart contract. Make sure to update these constants if deploying to a different environment.