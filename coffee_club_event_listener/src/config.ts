export const CONFIG = {
  NETWORK: process.env.SUI_NETWORK || 'testnet',
  POLLING_INTERVAL_MS: parseInt(process.env.POLLING_INTERVAL_MS || '5000'),
  COFFEE_CLUB_CONTRACT: {
    packageId: process.env.PACKAGE_ID || '0x...', // Replace with your actual package ID
  },
};
