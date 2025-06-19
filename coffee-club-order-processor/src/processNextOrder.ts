import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

(async () => {
  // Setup your Sui client
  const client = new SuiClient({ url: getFullnodeUrl("testnet") });

  // Constants
  const ADMIN_PHRASE = process.env.ADMIN_PHRASE;
  const PACKAGE_ID = process.env.PACKAGE_ADDRESS;
  const ADMIN_CAP = process.env.ADMIN_CAP;
  const CAFE_ID = process.env.CAFE_ID;
  const MODULE = "suihub_cafe";

  if (!ADMIN_PHRASE) {
    throw new Error("ADMIN_PHRASE environment variable is not set.");
  }
  const keypair = Ed25519Keypair.deriveKeypair(ADMIN_PHRASE);

  console.log("Creating cafe owner...");
  console.log(`Package ID: ${PACKAGE_ID}`);
  console.log(`Module: ${MODULE}`);
  console.log(`Admin Cap: ${ADMIN_CAP}`);
  console.log(`Address: ${keypair.toSuiAddress()}`);

  let transaction = new Transaction();

  transaction.moveCall({
    target: `${PACKAGE_ID}::${MODULE}::process_next_order`,
    arguments: [
      transaction.object(CAFE_ID!), // cafe: &mut SuiHubCafe
      transaction.object(
        "0x818f2d773e2b10a4bcf76d01d005ca6a3ef95212e6fa78ab6649d69a60e257e1"
      ), // order: &mut CoffeeOrder
    ],
  });

  try {
    const res = await client.signAndExecuteTransaction({
      transaction: transaction,
      signer: keypair,
      options: {
        showObjectChanges: true,
      },
    });

    console.log("Transaction Digest:", res.digest);
  } catch (e) {
    console.error(e);
  }
})();
