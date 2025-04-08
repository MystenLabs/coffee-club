import { SuiEvent } from '@mysten/sui/client';
import { prisma } from '../db';

type CafeCreatedEvent = {
  cafe_id: string;
  creator: string;
};

export const handleCafeEvents = async (events: SuiEvent[], type: string) => {
  console.log(
    `[CafeHandler] Processing ${events.length} cafe events of type ${type}`,
  );

  for (const event of events) {
    if (!event.type.includes('CafeCreated')) {
      console.log(
        `[CafeHandler] Skipping non-CafeCreated event: ${event.type}`,
      );
      continue;
    }

    const data = event.parsedJson as CafeCreatedEvent;
    console.log(
      `[CafeHandler] Processing cafe creation for cafe ${data.cafe_id}`,
    );

    try {
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
      console.log(`[CafeHandler] Successfully processed cafe ${data.cafe_id}`);
    } catch (error) {
      console.error(
        `[CafeHandler] Error processing cafe creation for ${data.cafe_id}:`,
        error,
      );
    }
  }
};
