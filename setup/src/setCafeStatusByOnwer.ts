import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

(async () => {
  const NETWORK = process.env.NETWORK! as "testnet" | "mainnet";
  // Setup your Sui client
  const client = new SuiClient({ url: getFullnodeUrl(NETWORK) });

  // Constants
  const ADMIN_PHRASE = process.env.ADMIN_PHRASE;
  const PACKAGE_ID = process.env.PACKAGE_ADDRESS;
  const CAFE_OWNER_ID = process.env.CAFE_OWNER_ID;
  const CAFE_ID = process.env.CAFE_ID;
  const MODULE = "suihub_cafe";

  if (!ADMIN_PHRASE) {
    throw new Error("ADMIN_PHRASE environment variable is not set.");
  }
  const keypair = Ed25519Keypair.deriveKeypair(ADMIN_PHRASE);

  console.log("Creating cafe owner...");
  console.log(`Package ID: ${PACKAGE_ID}`);
  console.log(`Module: ${MODULE}`);
  console.log(`Cafe Owber ID: ${CAFE_OWNER_ID}`);
  console.log(`Cafe ID: ${CAFE_ID}`);
  console.log(`Address: ${keypair.toSuiAddress()}`);

  let transaction = new Transaction();

  const status = transaction.moveCall({
    target: `${PACKAGE_ID}::${MODULE}::open`,
  });

  transaction.moveCall({
    target: `${PACKAGE_ID}::${MODULE}::set_cafe_status_by_onwer`,
    arguments: [
      transaction.object(CAFE_ID!), // cafe: &mut SuiHubCafe
      status, // new_status: CafeStatus
      transaction.object(CAFE_OWNER_ID!), // owner: &CafeOwner
    ],
  });

  try {
    const res = await client.signAndExecuteTransaction({
      transaction: transaction,
      signer: keypair,
    });
    console.log("Cafe status changed successfully!");
    console.log("Transaction Digest:", res.digest);
  } catch (e) {
    console.error(e);
  }
})();
