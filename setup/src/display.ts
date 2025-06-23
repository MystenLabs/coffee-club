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
  const PUBLISHER_ID = process.env.PUBLISHER_ID;
  const MODULE = "suihub_cafe";

  if (!ADMIN_PHRASE) {
    throw new Error("ADMIN_PHRASE environment variable is not set.");
  }
  if (!PACKAGE_ID) {
    throw new Error("PACKAGE_ADDRESS environment variable is not set.");
  }

  const keypair = Ed25519Keypair.deriveKeypair(ADMIN_PHRASE);

  console.log("Creating cafe owner...");
  console.log(`Package ID: ${PACKAGE_ID}`);
  console.log(`Module: ${MODULE}`);
  console.log(`Address: ${keypair.toSuiAddress()}`);

  let transaction = new Transaction();

  let display = transaction.moveCall({
    target: `0x2::display::new_with_fields`,
    arguments: [
      transaction.object(PUBLISHER_ID!),
      transaction.pure.vector("string", ["coffee", "image_url"]),
      transaction.pure.vector("string", [
        "{coffee_type}",
        "https://coffee-club-image-api.vercel.app/image/J9W9Sp_SaAGST4YXr1cKONnwAA91aIo5cnEwgFYKZJI",
      ]),
    ],
    typeArguments: [`${PACKAGE_ID}::${MODULE}::SuiHubCoffee`],
  });

  transaction.moveCall({
    target: "0x2::display::update_version",
    arguments: [display],
    typeArguments: [`${PACKAGE_ID}::${MODULE}::SuiHubCoffee`],
  });

  transaction.transferObjects(
    [display],
    transaction.pure.address(keypair.toSuiAddress())
  );

  try {
    const res = await client.signAndExecuteTransaction({
      transaction: transaction,
      signer: keypair,
      options: {
        showObjectChanges: true,
      },
    });
    console.log("Display successfully!");
    console.log("Transaction Digest:", res.digest);
  } catch (e) {
    console.error(e);
  }
})();
