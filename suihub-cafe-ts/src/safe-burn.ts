import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient } from "@mysten/sui/client";
import * as dotenv from "dotenv";

(async () => {
  dotenv.config({ path: "../.env" });

  const FULLNODE = "https://fullnode.testnet.sui.io:443";
  const ADMIN_PHRASE =
    "file already exercise jealous shallow coconut amazing found skirt mail food gauge";
  const ENOKI_SECRET_KEY = "enoki_private_042a8831b8621da8f95696f5e36a14ac";
  const PACKAGE_ID =
    "0x5e74ed009c121e64cf98e2883d6de4837b551c47b4e4024d9d9ca35223fd7eac";
  const SUILINK_REGISTRY_ID =
    "0xac15747c44a84bb6eaf13458d90bcb08fd3d9352ee0a55382fd1a279188d3449";
  const SUILINK_REGISTRY_V2_ID =
    "0x68f41f670878efac9539fd959cfb808a107d1a3eaad503c81be10c5552bc74f4";
  const NFT =
    "0x68fbe43cc9b1c12d0d82f3226852ba3bc083d2586caf46c3ab9bdfca503584ca";

  const keypair = Ed25519Keypair.deriveKeypair(ADMIN_PHRASE);

  // Client
  const client = new SuiClient({
    url: FULLNODE,
  });

  const packageId = PACKAGE_ID;
  const registry = SUILINK_REGISTRY_ID;
  const moduleName = "registry_v2";

  let transactionBlock = new Transaction();

  const rebateToPay = transactionBlock.moveCall({
    target: `${packageId}::utils::calculate_storage_rebate`,
    arguments: [
      transactionBlock.object(NFT),
      transactionBlock.pure.u64(15200n),
    ],
    typeArguments: [`${packageId}::solana::Solana`],
  });

  const coin = transactionBlock.splitCoins(transactionBlock.gas, [rebateToPay]);

  transactionBlock.moveCall({
    target: `${packageId}::registry_v2::safe_burn`,
    arguments: [
      transactionBlock.object(SUILINK_REGISTRY_V2_ID), // registry: &mut SuiLinkRegistryV2
      transactionBlock.object(NFT), // suilink: SuiLink<T>
      transactionBlock.pure.u32(1), // network: u32
      transactionBlock.object(coin), // c: Coin<SUI>
    ],
    typeArguments: [`${packageId}::solana::Solana`],
  });

  try {
    await client.signAndExecuteTransaction({
      transaction: transactionBlock,
      signer: keypair,
    });
  } catch (e) {
    console.error(e);
  }
})();
