import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import * as dotenv from "dotenv";
import { getAllOrders } from "./getAllOrders";

dotenv.config({ path: "../.env" });

// Setup your Sui client
const client = new SuiClient({ url: getFullnodeUrl("testnet") });

// Constants
const ADMIN_PHRASE = process.env.ADMIN_PHRASE;
const PACKAGE_ID = process.env.PACKAGE_ID;
const CAFE_ID = process.env.CAFE_ID;
const CAFE_MODULE = "suihub_cafe";
const CHECK_INTERVAL_MS = 10_000;
const PROCESSING_DURATION_MS = 30_000;

if (!ADMIN_PHRASE) {
  throw new Error("ADMIN_PHRASE environment variable is not set.");
}
const keypair = Ed25519Keypair.deriveKeypair(ADMIN_PHRASE);

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const processNextOrder = async (orderId: string) => {
  try {
    const transaction = new Transaction();
    transaction.moveCall({
      target: `${PACKAGE_ID}::${CAFE_MODULE}::process_next_order`,
      arguments: [
        transaction.object(CAFE_ID!), // cafe: &mut SuiHubCafe
        transaction.object(orderId), // order: &mut CoffeeOrder
      ],
    });

    const result = await client.signAndExecuteTransaction({
      transaction,
      signer: keypair,
      options: { showObjectChanges: true },
    });

    console.log(`Processed order ${orderId}`, result);
    return true;
  } catch (err) {
    console.error(`Failed to process order ${orderId}:`, err);
    return false;
  }
};

const completeCurrentOrder = async (orderId: string) => {
  try {
    const transaction = new Transaction();
    transaction.moveCall({
      target: `${PACKAGE_ID}::${CAFE_MODULE}::complete_current_order`,
      arguments: [
        transaction.object(CAFE_ID!), // cafe: &mut SuiHubCafe
        transaction.object(orderId), // order: &mut CoffeeOrder
      ],
    });

    const result = await client.signAndExecuteTransaction({
      transaction,
      signer: keypair,
      options: { showObjectChanges: true },
    });

    console.log(`Completed order ${orderId}`, result);
  } catch (err) {
    console.error(`Failed to complete order ${orderId}:`, err);
  }
};

const pollAndProcessOrders = async () => {
  while (true) {
    const { orders, error } = await getAllOrders();

    if (error) {
      console.error("Error fetching orders:", error);
      await delay(CHECK_INTERVAL_MS);
      continue;
    }

    if (orders.length === 0) {
      console.log("No orders found. Retrying in 10 seconds...");
      await delay(CHECK_INTERVAL_MS);
      continue;
    }

    for (const order of orders) {
      console.log(
        `Processing Order ID: ${order.orderId}, Placed By: ${
          order.placedBy
        }, At: ${new Date(order.placedAt).toLocaleString()}`
      );

      const success = await processNextOrder(order.orderId);
      if (!success) continue;

      await delay(PROCESSING_DURATION_MS);
      await completeCurrentOrder(order.orderId);
    }

    console.log(
      "Finished processing all current orders. Checking for new ones..."
    );
  }
};

pollAndProcessOrders();
