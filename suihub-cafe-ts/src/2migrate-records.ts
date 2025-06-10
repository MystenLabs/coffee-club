import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient } from "@mysten/sui/client";
import * as dotenv from "dotenv";

(async () => {
  dotenv.config({ path: "../.env" });

  const FULLNODE = "https://fullnode.testnet.sui.io:443";
  const ADMIN_PHRASE = "file already exercise jealous shallow coconut amazing found skirt mail food gauge";
  const ENOKI_SECRET_KEY = "enoki_private_042a8831b8621da8f95696f5e36a14ac";
  const PACKAGE_ID = "0x73181a56a5097e298c2a725f1ce71cd41d118a946c5c59439a7bcda01a569d27";
  const SUILINK_REGISTRY_ID = "0xf7a55d83e961a3078b240cedb4a9c61a34a85ce44c840fba0636f43ffa0608c3";
  const SUILINK_REGISTRY_V2_ID="0xb32de9a15b891ca6d6493e2929e7bafedf575545d8d9233596584bbebe3423a9";

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
    target: `${packageId}::${moduleName}::migrate_records`,
    arguments: [transactionBlock.object(SUILINK_REGISTRY_V2_ID!)],
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
