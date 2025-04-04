import { SuiClient } from '@mysten/sui/client';

const clients: Record<string, SuiClient> = {};

export function getClient(network: string): SuiClient {
  if (!clients[network]) {
    const rpcUrl = getRpcUrl(network);
    clients[network] = new SuiClient({ url: rpcUrl });
  }
  return clients[network];
}

function getRpcUrl(network: string): string {
  switch (network) {
    case 'mainnet':
      return 'https://fullnode.mainnet.sui.io:443';
    case 'testnet':
      return 'https://fullnode.testnet.sui.io:443';
    case 'devnet':
      return 'https://fullnode.devnet.sui.io:443';
    case 'localnet':
      return 'http://127.0.0.1:9000';
    default:
      throw new Error(`Unknown network: ${network}`);
  }
}
