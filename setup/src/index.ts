import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import * as dotenv from "dotenv";

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

// // Replace this with your actual GraphQL endpoint
// const GRAPHQL_ENDPOINT = "https://your.graphql.endpoint/query";

// // GraphQL query to fetch cafe data
// const fetchCafeState = async () => {
//   const response = await fetch(GRAPHQL_ENDPOINT, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       query: `
//                 query {
//                     cafe(id: "${CAFE_ID}") {
//                         id
//                         order_queue
//                         currently_processing
//                     }
//                 }
//             `,
//     }),
//   });

//   const result = await response.json();
//   return result.data.cafe;
// };

// // Call the Move function to process next order
// const processNextOrder = async () => {
//   const tx = new TransactionBlock();
//   tx.moveCall({
//     target: `${CAFE_MODULE}::process_next_order`,
//     arguments: [tx.object(CAFE_ID)],
//   });

//   const result = await client.signAndExecuteTransactionBlock({
//     transactionBlock: tx,
//     options: { showEvents: true },
//     signer: yourSigner, // inject your signer here
//   });

//   console.log("Processed next order", result);
//   const orderId = extractOrderIdFromEvent(result); // Implement based on your event
//   return orderId;
// };

// // Call the Move function to complete current order
// const completeCurrentOrder = async (orderId: string) => {
//   const tx = new TransactionBlock();
//   tx.moveCall({
//     target: `${CAFE_MODULE}::complete_current_order`,
//     arguments: [tx.object(CAFE_ID), tx.object(orderId)],
//   });

//   const result = await client.signAndExecuteTransactionBlock({
//     transactionBlock: tx,
//     options: { showEvents: true },
//     signer: yourSigner,
//   });

//   console.log("Completed order", result);
// };

// // Your polling + processing loop
// const runCafeService = async () => {
//   while (true) {
//     try {
//       const cafe = await fetchCafeState();
//       const hasOrders = cafe.order_queue.length > 0;
//       const isBusy = cafe.currently_processing !== null;

//       if (!isBusy && !isProcessing && hasOrders) {
//         console.log("Ready to process next order...");
//         currentOrderId = await processNextOrder();
//         isProcessing = true;
//         processingStartTime = Date.now();
//       }

//       if (
//         isProcessing &&
//         processingStartTime &&
//         Date.now() - processingStartTime >= PROCESSING_DURATION_MS
//       ) {
//         if (currentOrderId) {
//           await completeCurrentOrder(currentOrderId);
//           isProcessing = false;
//           currentOrderId = null;
//           processingStartTime = null;
//         }
//       }
//     } catch (error) {
//       console.error("Error in cafe service loop:", error);
//     }

//     await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL_MS));
//   }
// };

// // Utility to extract order_id from emitted events
// const extractOrderIdFromEvent = (result: any): string | null => {
//   const events = result.events || [];
//   const processingEvent = events.find((e: any) =>
//     e.type.endsWith("::CoffeeOrderProcessing")
//   );
//   return processingEvent?.parsedJson?.order_id || null;
// };

// // Start the service
// runCafeService();
