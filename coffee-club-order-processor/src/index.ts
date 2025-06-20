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
const PACKAGE_ADDRESS = process.env.PACKAGE_ADDRESS;
const CAFE_ID = process.env.CAFE_ID;
const CAFE_MODULE = "suihub_cafe";
const CHECK_INTERVAL_MS = 10_000;
const PROCESSING_DURATION_MS = 30_000;

if (!ADMIN_PHRASE) {
  throw new Error("ADMIN_PHRASE environment variable is not set.");
}
if (!PACKAGE_ADDRESS) {
  throw new Error("PACKAGE_ADDRESS environment variable is not set.");
}
if (!CAFE_ID) {
  throw new Error("CAFE_ID environment variable is not set.");
}

const keypair = Ed25519Keypair.deriveKeypair(ADMIN_PHRASE);

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const processNextOrder = async (orderId: string) => {
  if (!CAFE_ID) {
    console.error("CAFE_ID is not set in environment variables.");
    return false;
  }
  if (!orderId) {
    console.error("Order ID is required to process the order.");
    return false;
  }
  // try {
  //   const transaction = new Transaction();
  //   transaction.moveCall({
  //     target: `${PACKAGE_ADDRESS}::${CAFE_MODULE}::process_next_order`,
  //     arguments: [
  //       transaction.object(CAFE_ID!), // cafe: &mut SuiHubCafe
  //       transaction.object(orderId), // order: &mut CoffeeOrder
  //     ],
  //   });

  //   const result = await client.signAndExecuteTransaction({
  //     transaction,
  //     signer: keypair,
  //     options: { showObjectChanges: true },
  //   });

  //   console.log(`Processed order ${orderId}`, result);
  //   return true;
  // } catch (err) {
  //   console.error(`Failed to process order ${orderId}:`, err);
  //   return false;
  // }

  console.log(`Simulating processing order ${orderId}`);
  await delay(1_000);
};

const completeCurrentOrder = async (orderId: string) => {
  // try {
  //   const transaction = new Transaction();
  //   transaction.moveCall({
  //     target: `${PACKAGE_ADDRESS}::${CAFE_MODULE}::complete_current_order`,
  //     arguments: [
  //       transaction.object(CAFE_ID!), // cafe: &mut SuiHubCafe
  //       transaction.object(orderId), // order: &mut CoffeeOrder
  //     ],
  //   });

  //   const result = await client.signAndExecuteTransaction({
  //     transaction,
  //     signer: keypair,
  //     options: { showObjectChanges: true },
  //   });

  //   console.log(`Completed order ${orderId}`, result);
  // } catch (err) {
  //   console.error(`Failed to complete order ${orderId}:`, err);
  // }

  console.log(`Simulating completion of order ${orderId}`);
  await delay(1_000);
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

    // Use a copy of the array to safely remove processed ones
    const pendingOrders = [...orders];

    while (pendingOrders.length > 0) {
      const order = pendingOrders.shift(); // Get and remove first order
      if (!order) break;

      console.log(
        `Processing Order ID: ${order.orderId}, Placed By: ${
          order.placedBy
        }, At: ${new Date(order.placedAt).toLocaleString()}, Status: ${
          order.status
        }`
      );

      const success = await processNextOrder(order.orderId);
      if (!success) continue; // Skip completion if processing failed

      await delay(PROCESSING_DURATION_MS);
      await completeCurrentOrder(order.orderId);
    }

    console.log("Finished processing batch. Rechecking for new orders...");
  }
};

pollAndProcessOrders();
