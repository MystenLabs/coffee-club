import { SuiEvent } from '@mysten/sui/client';
import { prisma } from '../db';
import { getClient } from '../sui-utils';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { CONFIG } from '../config';

const execAsync = promisify(exec);

type CoffeeOrderEvent = {
  order_id: string;
  status?: { variant: string }; // Add status field for CoffeeOrderUpdated events
};

// Initialize SUI client using the configured network
const suiClient = getClient(process.env.SUI_NETWORK || 'testnet');

async function makeCoffee(orderId: string) {
  try {
    // First check the order status from blockchain
    const orderObject = await suiClient.getObject({
      id: orderId,
      options: { showContent: true },
    });

    if (!orderObject.data?.content) {
      console.error(
        `[OrderHandler] Failed to fetch order ${orderId} from blockchain`,
      );
      return;
    }

    const content = orderObject.data.content;
    if (
      'fields' in content &&
      typeof content.fields === 'object' &&
      content.fields !== null &&
      'status' in content.fields
    ) {
      const status = content.fields.status as { variant: string };
      const statusString = status.variant;

      // Changed from 'Created' to 'Processing' to match the new workflow
      if (statusString !== 'Processing') {
        console.log(
          `[OrderHandler] Skipping coffee making for order ${orderId} with blockchain status ${statusString}`,
        );
        return;
      }

      const macAddress = CONFIG.COFFEE_MACHINE.macAddress;
      if (!macAddress) {
        console.error(
          '[OrderHandler] Coffee machine MAC_ADDRESS not configured properly',
        );
        return;
      }

      // Get the absolute path to the Python script
      const controllerPath = path.join(
        process.cwd(),
        '../delonghi_controller/src/delonghi_controller.py',
      );

      console.log(`[OrderHandler] Current directory: ${process.cwd()}`);
      console.log(`[OrderHandler] Controller path: ${controllerPath}`);

      // Add error checking for file existence
      if (!fs.existsSync(controllerPath)) {
        console.error(
          `[OrderHandler] Controller not found at ${controllerPath}`,
        );
        return;
      }

      // Get coffee type from the order
      let coffeeType = 'espresso'; // Default
      if ('coffee_type' in content.fields) {
        const coffeeTypeObj = content.fields.coffee_type;
        if (typeof coffeeTypeObj === 'object' && coffeeTypeObj !== null && 'variant' in coffeeTypeObj) {
          coffeeType = coffeeTypeObj.variant.toLowerCase();
        }
      }

      const { stdout, stderr } = await execAsync(
        `python3.13 ${controllerPath} ${macAddress} ${coffeeType}`,
      );

      if (stderr) {
        console.error(`[OrderHandler] Coffee machine error: ${stderr}`);
        return;
      }

      console.log(`[OrderHandler] Coffee machine output: ${stdout}`);
    } else {
      console.error(
        `[OrderHandler] Could not find status in fields for order ${orderId}`,
      );
    }
  } catch (error) {
    console.error(`[OrderHandler] Failed to trigger coffee machine: ${error}`);
  }
}

export const handleOrderEvents = async (events: SuiEvent[], type: string) => {
  console.log(
    `[OrderHandler] Processing ${events.length} order events of type ${type}`,
  );

  for (const event of events) {
    const data = event.parsedJson as CoffeeOrderEvent;
    console.log(`[OrderHandler] Processing event for order ${data.order_id}`);

    if (event.type.includes('CoffeeOrderCreated')) {
      console.log(`[OrderHandler] Creating new order ${data.order_id}`);
      await prisma.coffeeOrder.upsert({
        where: {
          objectId: data.order_id,
        },
        create: {
          objectId: data.order_id,
          status: 'Created',
          createdAt: new Date(),
        },
        update: {},
      });
      console.log(`[OrderHandler] Successfully created order ${data.order_id}`);
      
      // No longer trigger coffee machine for newly created orders
    } else if (event.type.includes('CoffeeOrderUpdated')) {
      try {
        console.log(
          `[OrderHandler] Processing order update for ${data.order_id}`,
        );

        // Check if the status in the event data is 'Processing'
        const isProcessingStatus = data.status && data.status.variant === 'Processing';

        const order = await prisma.coffeeOrder.findUnique({
          where: {
            objectId: data.order_id,
          },
        });

        if (!order) {
          console.error(`[OrderHandler] Order ${data.order_id} not found`);
          continue;
        }

        // If status is already 'Processing' in the database, skip to avoid duplicate processing
        if (order.status === 'Processing') {
          console.log(
            `[OrderHandler] Order ${data.order_id} is already being processed`,
          );
          continue;
        }

        // Update the order status in the database
        await prisma.coffeeOrder.update({
          where: {
            objectId: data.order_id,
          },
          data: {
            status: isProcessingStatus ? 'Processing' : data.status?.variant || order.status,
          },
        });

        // If the order has been updated to 'Processing', trigger the coffee machine
        if (isProcessingStatus) {
          console.log(`[OrderHandler] Triggering coffee machine for order ${data.order_id}`);
          await makeCoffee(data.order_id);
        }
      } catch (error) {
        console.error(
          `[OrderHandler] Failed to process order update: ${error}`,
        );
      }
    }
  }
};
