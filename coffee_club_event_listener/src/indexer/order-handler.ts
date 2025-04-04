import { SuiEvent } from '@mysten/sui/client';
import { prisma } from '../db';

type CoffeeOrderEvent = {
  order_id: string;
};

export const handleOrderEvents = async (events: SuiEvent[], type: string) => {
  console.log(`Processing ${events.length} order events of type ${type}`);

  for (const event of events) {
    const data = event.parsedJson as CoffeeOrderEvent;

    if (event.type.includes('CoffeeOrderCreated')) {
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
    } else if (event.type.includes('CoffeeOrderUpdated')) {
      // For order updates, we'll need to fetch the current status from the blockchain
      // This is a simplified version - in a real app, you'd query the object to get its current status
      await prisma.coffeeOrder.update({
        where: {
          objectId: data.order_id,
        },
        data: {
          updatedAt: new Date(),
        },
      });
    }
  }
};
