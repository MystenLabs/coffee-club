import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

interface OrderInfo {
  orderId: string;
  placedBy: string;
  placedAt: number;
}

interface CafeStatusResponse {
  object: {
    asMoveObject: {
      contents: {
        data: {
          Struct: Array<{
            name: string;
            value: any;
          }>;
        };
      };
    };
  };
}

const toHexString = (byteArray: number[]): string =>
  "0x" + byteArray.map((b) => b.toString(16).padStart(2, "0")).join("");

const gqlClient = new SuiGraphQLClient({
  url: "https://sui-testnet.mystenlabs.com/graphql",
});

const cafeStatusQuery = graphql(`
  query getCafeStatus($address: String!) {
    object(address: $address) {
      asMoveObject {
        contents {
          data
        }
      }
    }
  }
`);

const orderQuery = graphql(`
  query getOrderDetails($address: String!) {
    object(address: $address) {
      asMoveObject {
        contents {
          data
        }
      }
    }
  }
`);

const extractOrderQueueIds = (data: CafeStatusResponse): string[] => {
  const structFields = data?.object?.asMoveObject?.contents?.data?.Struct;
  if (!Array.isArray(structFields)) return [];

  const orderQueueField = structFields.find((f) => f.name === "order_queue");
  const vector = orderQueueField?.value?.Vector;

  if (!Array.isArray(vector)) return [];

  return vector.map((v) => toHexString(v.ID));
};

const extractOrderInfo = (data: CafeStatusResponse): OrderInfo | null => {
  const fields = data?.object?.asMoveObject?.contents?.data?.Struct;
  if (!Array.isArray(fields)) return null;

  const orderIdField = fields.find((f) => f.name === "id");
  const placedByField = fields.find((f) => f.name === "placed_by");
  const placedAtField = fields.find((f) => f.name === "placed_at");

  const orderId = orderIdField?.value?.UID
    ? toHexString(orderIdField.value.UID)
    : undefined;
  const placedBy = placedByField?.value?.Address
    ? toHexString(placedByField.value.Address)
    : undefined;
  const placedAt = placedAtField?.value?.Number
    ? parseInt(placedAtField.value.Number, 10)
    : undefined;

  if (orderId && placedBy && typeof placedAt === "number") {
    return { orderId, placedBy, placedAt };
  }
  return null;
};

export const getAllOrders = async (): Promise<{
  orders: OrderInfo[];
  error?: string;
}> => {
  try {
    const cafeAddress = process.env.CAFE_ID;
    if (!cafeAddress) throw new Error("Missing cafe address in env");

    const result = await gqlClient.query({
      query: cafeStatusQuery,
      variables: { address: cafeAddress },
    });

    const orderIds = extractOrderQueueIds(result.data as CafeStatusResponse);

    const orders: OrderInfo[] = [];

    for (const orderId of orderIds) {
      try {
        const orderResult = await gqlClient.query({
          query: orderQuery,
          variables: { address: orderId },
        });
        const info = extractOrderInfo(orderResult.data as CafeStatusResponse);
        if (info) {
          orders.push(info);
        }
      } catch (err) {
        console.error(`Failed to fetch order ${orderId}:`, err);
      }
    }

    return {
      orders: orders.sort((a, b) => a.placedAt - b.placedAt),
    };
  } catch (err) {
    console.error("Failed to fetch orders:", err);
    return {
      orders: [],
      error: (err as Error).message,
    };
  }
};
