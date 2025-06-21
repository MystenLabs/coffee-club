import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { exec } from "child_process";
import * as dotenv from "dotenv";
import { promisify } from "util";
import * as path from "path";
import { getAllOrders } from "./getAllOrders";

dotenv.config({ path: "../.env" });

// Setup your Sui client
const client = new SuiClient({ url: getFullnodeUrl("testnet") });

const execAsync = promisify(exec);

// Constants
const ADMIN_PHRASE = process.env.ADMIN_PHRASE;
const PACKAGE_ADDRESS = process.env.PACKAGE_ADDRESS;
const CAFE_ID = process.env.CAFE_ID;
const MANAGER_CAP = process.env.MANAGER_CAP;
const CAFE_OWNER_ID = process.env.CAFE_OWNER_ID;
const CAFE_MODULE = "suihub_cafe";
const CHECK_INTERVAL_MS = 10_000;
const PROCESSING_DURATION_MS = 120_000;
const CONTROLLER_PATH = path.join(
  __dirname,
  "../../delonghi_controller/src/delonghi_controller.py"
);
const MAC_ADDRESS = process.env.MAC_ADDRESS;

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

const processOrder = async (orderId: string) => {
  if (!CAFE_ID) {
    console.error("CAFE_ID is not set in environment variables.");
    return false;
  }
  if (!orderId) {
    console.error("Order ID is required to process the order.");
    return false;
  }

  try {
    const transaction = new Transaction();
    transaction.moveCall({
      target: `${PACKAGE_ADDRESS}::${CAFE_MODULE}::process_order`,
      arguments: [
        transaction.object(MANAGER_CAP!), // cafeManager: &CafeManager
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

const completeOrder = async (orderId: string) => {
  try {
    const transaction = new Transaction();
    transaction.moveCall({
      target: `${PACKAGE_ADDRESS}::${CAFE_MODULE}::complete_order`,
      arguments: [
        transaction.object(MANAGER_CAP!), // cafeManager: &CafeManager
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

const deleteCompletedOrder = async (orderId: string) => {
  try {
    const transaction = new Transaction();
    transaction.moveCall({
      target: `${PACKAGE_ADDRESS}::${CAFE_MODULE}::delete_completed_order`,
      arguments: [
        transaction.object(MANAGER_CAP!), // cafeManager: &CafeManager
        transaction.object(CAFE_ID!), // cafe: &mut SuiHubCafe
        transaction.object(orderId), // order: &mut CoffeeOrder
      ],
    });

    const result = await client.signAndExecuteTransaction({
      transaction,
      signer: keypair,
      options: { showObjectChanges: true },
    });

    console.log(`Deleted order ${orderId}`, result);
  } catch (err) {
    console.error(`Failed to delete order ${orderId}:`, err);
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

    // Use a copy of the array to safely remove processed ones
    const pendingOrders = [...orders];

    while (pendingOrders.length > 0) {
      const order = pendingOrders.shift(); // Get and remove first order
      if (!order) break;

      console.log(
        `Evaluating Order ID: ${order.orderId}, Status: ${order.status}`
      );

      switch (order.status) {
        case "Created":
          console.log(`Processing and completing order ${order.orderId}...`);
          if (await processOrder(order.orderId)) {
            const coffeeType = order.coffeeType?.toLowerCase().trim();
            console.log("Sending Pythong Command");
            console.log(
              `python3 ${CONTROLLER_PATH} ${MAC_ADDRESS} ${coffeeType}`
            );
            const { stdout, stderr } = await execAsync(
              `python3 ${CONTROLLER_PATH} ${MAC_ADDRESS} ${coffeeType}`
            );
            await delay(PROCESSING_DURATION_MS);
            await completeOrder(order.orderId);
          }
          break;

        case "Processing":
          console.log(
            `Completing order ${
              order.orderId
            }... with coffee type ${order.coffeeType?.toLowerCase()}`
          );

          await completeOrder(order.orderId);
          break;

        case "Completed":
          if (order.placedAt) {
            const placedTime = new Date(order.placedAt).getTime();
            const oneHourAgo = Date.now() - 60 * 60 * 1000;

            if (placedTime < oneHourAgo) {
              console.log(
                `Order ${order.orderId} was completed and placed more than an hour ago (placed at ${order.placedAt})`
              );
              await deleteCompletedOrder(order.orderId);
            }
          } else {
            console.warn(`Order ${order.orderId} is missing 'placedAt' field.`);
          }
          console.log(
            `Skipping order ${order.orderId} with status ${order.status}`
          );
          break;

        case "Cancelled":
          console.log(
            `Skipping order ${order.orderId} with status ${order.status}`
          );
          break;

        default:
          console.warn(
            `Unknown status for order ${order.orderId}: ${order.status}`
          );
          break;
      }
    }

    console.log("Finished processing batch. Rechecking for new orders...");
  }
};

pollAndProcessOrders();
