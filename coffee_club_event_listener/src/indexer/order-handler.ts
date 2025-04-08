import { SuiEvent } from '@mysten/sui/client';
import { prisma } from '../db';
import { getClient } from '../sui-utils';

type CoffeeOrderEvent = {
  order_id: string;
};

// Initialize SUI client using the configured network
const suiClient = getClient(process.env.SUI_NETWORK || 'testnet');

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
    } else if (event.type.includes('CoffeeOrderUpdated')) {
      try {
        console.log(
          `[OrderHandler] Fetching order ${data.order_id} from blockchain`,
        );
        const orderObject = await suiClient.getObject({
          id: data.order_id,
          options: { showContent: true },
        });

        if (!orderObject.data?.content) {
          console.error(
            `[OrderHandler] Failed to fetch order ${data.order_id} from blockchain`,
          );
          continue;
        }

        console.log(
          `[OrderHandler] Extracting status from order object ${data.order_id}`,
        );
        const content = orderObject.data.content;
        let statusString = '';
        if (
          'fields' in content &&
          typeof content.fields === 'object' &&
          content.fields !== null &&
          'status' in content.fields
        ) {
          const status = content.fields.status as { variant: string };
          statusString = status.variant;
          console.log(
            `[OrderHandler] Found status "${statusString}" for order ${data.order_id}`,
          );
        } else {
          console.error(
            `[OrderHandler] Could not find status in fields for order ${data.order_id}`,
          );
          continue;
        }

        console.log(
          `[OrderHandler] Updating order ${data.order_id} with status "${statusString}"`,
        );
        await prisma.coffeeOrder.upsert({
          where: {
            objectId: data.order_id,
          },
          create: {
            objectId: data.order_id,
            status: statusString,
            createdAt: new Date(),
          },
          update: {
            status: statusString,
            updatedAt: new Date(),
          },
        });
        console.log(
          `[OrderHandler] Successfully updated order ${data.order_id}`,
        );
      } catch (error) {
        console.error(
          `[OrderHandler] Error processing order update for ${data.order_id}:`,
          error,
        );
      }
    }
  }
};
