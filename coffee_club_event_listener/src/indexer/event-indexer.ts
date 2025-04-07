import {
  EventId,
  SuiClient,
  SuiEvent,
  SuiEventFilter,
} from '@mysten/sui/client';
import { CONFIG } from '../config';
import { prisma } from '../db';
import { getClient } from '../sui-utils';
import { handleCafeEvents } from './cafe-handler';
import { handleOrderEvents } from './order-handler';

type SuiEventsCursor = EventId | null | undefined;

type EventExecutionResult = {
  cursor: SuiEventsCursor;
  hasNextPage: boolean;
};

type EventTracker = {
  type: string;
  filter: SuiEventFilter;
  callback: (events: SuiEvent[], type: string) => any;
};

const EVENTS_TO_TRACK: EventTracker[] = [
  {
    type: `${CONFIG.COFFEE_CLUB_CONTRACT.packageId}::coffee_club::CafeCreated`,
    filter: {
      MoveEventType: `${CONFIG.COFFEE_CLUB_CONTRACT.packageId}::coffee_club::CafeCreated`,
    },
    callback: handleCafeEvents,
  },
  {
    type: `${CONFIG.COFFEE_CLUB_CONTRACT.packageId}::coffee_club::CoffeeOrderCreated`,
    filter: {
      MoveEventType: `${CONFIG.COFFEE_CLUB_CONTRACT.packageId}::coffee_club::CoffeeOrderCreated`,
    },
    callback: handleOrderEvents,
  },
  {
    type: `${CONFIG.COFFEE_CLUB_CONTRACT.packageId}::coffee_club::CoffeeOrderUpdated`,
    filter: {
      MoveEventType: `${CONFIG.COFFEE_CLUB_CONTRACT.packageId}::coffee_club::CoffeeOrderUpdated`,
    },
    callback: handleOrderEvents,
  },
];

const executeEventJob = async (
  client: SuiClient,
  tracker: EventTracker,
  cursor: SuiEventsCursor,
): Promise<EventExecutionResult> => {
  try {
    console.log(
      `Querying events for ${tracker.type} with cursor:`,
      cursor ? JSON.stringify(cursor) : 'null',
    );

    // Validate filter before making the request
    if (!tracker.filter || !('MoveEventType' in tracker.filter)) {
      throw new Error(
        `Invalid event filter for ${tracker.type}: ${JSON.stringify(tracker.filter)}`,
      );
    }

    const { data, hasNextPage, nextCursor } = await client.queryEvents({
      query: tracker.filter,
      cursor,
      order: 'ascending',
    });

    console.log(`Retrieved ${data.length} events for ${tracker.type}`);

    if (data.length > 0) {
      console.log(`First event in batch: ${JSON.stringify(data[0])}`);
    }

    await tracker.callback(data, tracker.type);

    if (nextCursor && data.length > 0) {
      console.log(
        `Saving cursor for ${tracker.type}:`,
        JSON.stringify(nextCursor),
      );
      await saveLatestCursor(tracker, nextCursor);

      return {
        cursor: nextCursor,
        hasNextPage,
      };
    }
  } catch (e) {
    const error = e as Error;
    console.error(`Error processing events for ${tracker.type}:`, {
      message: error.message,
      stack: error.stack,
      filter: JSON.stringify(tracker.filter),
      cursor: cursor ? JSON.stringify(cursor) : 'null',
    });

    // Add retry logic with exponential backoff for transient errors
    if (isTransientError(error)) {
      console.log(`Transient error detected for ${tracker.type}, will retry`);
    }
  }
  return {
    cursor,
    hasNextPage: false,
  };
};

// Helper function to identify transient errors that can be retried
const isTransientError = (error: Error): boolean => {
  // Add logic to identify transient errors (network issues, rate limiting, etc.)
  const transientErrorMessages = [
    'network error',
    'timeout',
    'rate limit',
    'too many requests',
  ];

  return transientErrorMessages.some((msg) =>
    error.message.toLowerCase().includes(msg.toLowerCase()),
  );
};

const runEventJob = async (
  client: SuiClient,
  tracker: EventTracker,
  cursor: SuiEventsCursor,
) => {
  try {
    const result = await executeEventJob(client, tracker, cursor);

    const delay = result.hasNextPage ? 0 : CONFIG.POLLING_INTERVAL_MS;
    console.log(`Scheduling next run for ${tracker.type} in ${delay}ms`);

    setTimeout(() => {
      runEventJob(client, tracker, result.cursor);
    }, delay);
  } catch (e) {
    const error = e as Error;
    console.error(`Critical error in event job for ${tracker.type}:`, {
      message: error.message,
      stack: error.stack,
    });

    // Implement recovery mechanism - retry after a delay
    console.log(
      `Attempting recovery for ${tracker.type} in ${CONFIG.ERROR_RETRY_INTERVAL_MS}ms`,
    );
    setTimeout(() => {
      runEventJob(client, tracker, cursor);
    }, CONFIG.ERROR_RETRY_INTERVAL_MS);
  }
};

const getLatestCursor = async (tracker: EventTracker) => {
  try {
    console.log(`Retrieving latest cursor for ${tracker.type}`);
    const cursor = await prisma.cursor.findUnique({
      where: {
        id: tracker.type,
      },
    });

    console.log(
      `Retrieved cursor for ${tracker.type}:`,
      cursor ? JSON.stringify(cursor) : 'null',
    );
    return cursor || undefined;
  } catch (e) {
    const error = e as Error;
    console.error(`Error retrieving cursor for ${tracker.type}:`, {
      message: error.message,
      stack: error.stack,
    });
    return undefined;
  }
};

const saveLatestCursor = async (tracker: EventTracker, cursor: EventId) => {
  try {
    const data = {
      eventSeq: cursor.eventSeq,
      txDigest: cursor.txDigest,
    };

    console.log(`Saving cursor for ${tracker.type}:`, JSON.stringify(data));

    return await prisma.cursor.upsert({
      where: {
        id: tracker.type,
      },
      update: data,
      create: { id: tracker.type, ...data },
    });
  } catch (e) {
    const error = e as Error;
    console.error(`Error saving cursor for ${tracker.type}:`, {
      message: error.message,
      stack: error.stack,
      cursor: JSON.stringify(cursor),
    });
    throw error; // Re-throw to allow calling code to handle
  }
};

export const setupListeners = async () => {
  console.log('Setting up event listeners for Coffee Club events...');
  console.log(`Contract package ID: ${CONFIG.COFFEE_CLUB_CONTRACT.packageId}`);
  console.log(`Network: ${CONFIG.NETWORK}`);
  console.log(`Polling interval: ${CONFIG.POLLING_INTERVAL_MS}ms`);

  try {
    for (const event of EVENTS_TO_TRACK) {
      console.log(`Initializing listener for ${event.type}`);
      const cursor = await getLatestCursor(event);
      runEventJob(getClient(CONFIG.NETWORK), event, cursor);
    }
    console.log('All event listeners initialized successfully');
  } catch (e) {
    const error = e as Error;
    console.error('Failed to set up event listeners:', {
      message: error.message,
      stack: error.stack,
    });

    // In a production app, you might want to:
    // 1. Send alerts to monitoring systems
    // 2. Attempt recovery
    // 3. Exit with non-zero code if critical

    throw new Error(`Failed to initialize event listeners: ${error.message}`);
  }
};
