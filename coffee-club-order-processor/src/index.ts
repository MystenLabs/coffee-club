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

// Local in-memory state
let isProcessing = false;
let processingStartTime: number | null = null;
let currentOrderId: string | null = null;

// Call the Move function to process next order
const processNextOrder = async (orderId: string) => {
  const transaction = new Transaction();
  transaction.moveCall({
    target: `${PACKAGE_ID}::${CAFE_MODULE}::process_next_order`,
    arguments: [
      transaction.object(CAFE_ID!), // cafe: &mut SuiHubCafe
      transaction.object(orderId), // order: &mut CoffeeOrder
    ],
  });

  const result = await client.signAndExecuteTransaction({
    transaction: transaction,
    signer: keypair,
    options: {
      showObjectChanges: true,
    },
  });

  console.log("Processed next order", result);
};

// Call the Move function to complete current order
const completeCurrentOrder = async (orderId: string) => {
  const transaction = new Transaction();
  transaction.moveCall({
    target: `${PACKAGE_ID}::${CAFE_MODULE}::complete_current_order`,
    arguments: [
      transaction.object(CAFE_ID!), // cafe: &mut SuiHubCafe
      transaction.object(orderId), // order: &mut CoffeeOrder
    ],
  });

  const result = await client.signAndExecuteTransaction({
    transaction: transaction,
    signer: keypair,
    options: {
      showObjectChanges: true,
    },
  });

  console.log("Completed order", result);
};

async function processOrders() {
  const { orders, error } = await getAllOrders();
  if (error) {
    console.error("Error fetching orders:", error);
    return;
  }
  orders.forEach((order) => {
    console.log(
      `Order ID: ${order.orderId}, Placed By: ${
        order.placedBy
      }, Placed At: ${new Date(order.placedAt).toLocaleString()}`
    );
    processNextOrder(order.orderId);
    // Wait for processing to complete. Wait 30 seconds before processing the next order.
    completeCurrentOrder(order.orderId);
  });
}

processOrders();
