import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient } from "@mysten/sui/client";
import * as dotenv from "dotenv";

(async () => {

  const FULLNODE = "https://fullnode.testnet.sui.io:443";
  const ADMIN_PHRASE = "file already exercise jealous shallow coconut amazing found skirt mail food gauge";
  const ENOKI_SECRET_KEY = "enoki_private_042a8831b8621da8f95696f5e36a14ac";
  const PACKAGE_ID = "0x525948ad2ef9736d73516f0f128b513b59637f7f23eea6d5531f9ab8949b1b05";
  const SUILINK_REGISTRY_ID = "0x9b63f563698c5f3cc58f178f6ff3e540d0c4e69ef18335ad303a19b5e5c00f3e";
  const SUILINK_REGISTRY_V2_ID="0xb29a475f6e41e1f9042addc0e2b6e15a15fe9956b9c91654d34dd3b9228d6d66"

  const keypair = Ed25519Keypair.deriveKeypair(ADMIN_PHRASE);

  // Client
  const client = new SuiClient({
    url: FULLNODE,
  });

  const packageId = PACKAGE_ID;
  const registry = SUILINK_REGISTRY_ID;
  const moduleName = "registry_v2";

  let transactionBlock = new Transaction();

  transactionBlock.moveCall({
    target: `${packageId}::${moduleName}::setup_config`,
    arguments: [transactionBlock.object(SUILINK_REGISTRY_V2_ID)],
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
