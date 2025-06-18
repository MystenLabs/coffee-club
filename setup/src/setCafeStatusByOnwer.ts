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
  const PERMISSIONS_TO_OPEN_CAFE_ID = process.env.PERMISSIONS_TO_OPEN_CAFE_ID;
  const MODULE = "suihub_cafe";

  if (!ADMIN_PHRASE) {
    throw new Error("ADMIN_PHRASE environment variable is not set.");
  }
  const keypair = Ed25519Keypair.deriveKeypair(ADMIN_PHRASE);

  console.log("Creating cafe owner...");
  console.log(`Package ID: ${PACKAGE_ID}`);
  console.log(`Module: ${MODULE}`);
  console.log(`Permissions to Open Cafe ID: ${PERMISSIONS_TO_OPEN_CAFE_ID}`);
  console.log(`Address: ${keypair.toSuiAddress()}`);

  let transaction = new Transaction();

  transaction.moveCall({
    target: `${PACKAGE_ID}::${MODULE}::set_cafe_status_by_onwer`,
    arguments: [
      transaction.object(PERMISSIONS_TO_OPEN_CAFE_ID!), // permission: PermissionToOpenCafe,
      transaction.pure.string("SuiHub Athens"), // name: String
      transaction.pure.string("Athens, GR"), // location: String
      transaction.pure.string("SuiHub Athens"), // description: String
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
    console.log("Cafe created successfully!");
    console.log("Transaction Digest:", res.digest);

    const cafe = res.objectChanges?.find(
      (o) =>
        o.type === "created" && o.objectType.endsWith("suihub_cafe::SuiHubCafe")
    );

    console.log("Cafe:", cafe);
  } catch (e) {
    console.error(e);
  }
})();
