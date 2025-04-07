import { SuiEvent } from '@mysten/sui/client';
import { prisma } from '../db';

type CafeCreatedEvent = {
  cafe_id: string;
  creator: string;
};

export const handleCafeEvents = async (events: SuiEvent[], type: string) => {
  console.log(`Processing ${events.length} cafe events of type ${type}`);

  for (const event of events) {
    if (!event.type.includes('CafeCreated')) continue;

    const data = event.parsedJson as CafeCreatedEvent;

    await prisma.cafe.upsert({
      where: {
        objectId: data.cafe_id,
      },
      create: {
        objectId: data.cafe_id,
        creator: data.creator,
        createdAt: new Date(),
      },
      update: {
        creator: data.creator,
      },
    });
  }
};
