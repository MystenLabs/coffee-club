import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient } from "@mysten/sui/client";
import * as dotenv from "dotenv";

(async () => {
  dotenv.config({ path: "../.env" });

  const FULLNODE = "https://fullnode.mainnet.sui.io:443";
  const ADMIN_PHRASE = "";
  const ENOKI_SECRET_KEY = "enoki_private_042a8831b8621da8f95696f5e36a14ac";
  const PACKAGE_ID = "0x358fb2cf8d041bbcdb46f0782ff23fb88c3fe15d10f481b721344241e6692a9b";
  const SUILINK_REGISTRY_ID = "0xc0353bf80ec9dd14e0e8e5e3b19057fdcb52b9d8c205113defc26ed96747b878";

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
    target: `${packageId}::${moduleName}::update_version`,
    arguments: [
      transactionBlock.object(registry!), // registry: &mut SuiLinkRegistry
    ],
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
