import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

interface OrderInfo {
  orderId: string;
  placedBy: string;
  placedAt: number;
  status: "Created" | "Processing" | "Completed" | "Cancelled";
  coffeeType:
    | "Espresso"
    | "Americano"
    | "Doppio"
    | "Long"
    | "HotWater"
    | "Coffee"
    | undefined;
}

interface PartialOrderInfo extends Omit<OrderInfo, "status"> {}

interface MoveObjectDataResponse {
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

interface MoveValue {
  __typename: string;
  type: {
    repr: string;
  };
  json: {
    contents: string[];
  };
}

interface Node {
  name: {
    type: {
      repr: string;
    };
    json: string;
  };
  value: MoveValue;
}

interface Data {
  owner: {
    dynamicFields: {
      nodes: Node[];
    };
  };
}

interface DynamicFieldResponse {
  owner: {
    dynamicFields: {
      nodes: Array<{
        name: {
          type: {
            repr: string;
          };
          json: string;
        };
        value: {
          __typename: string;
          type?: {
            repr: string;
          };
          json?: any;
          contents?: {
            type: {
              repr: string;
            };
            json: any;
          };
        };
      }>;
    };
  };
}

const toHexString = (byteArray: number[]): string =>
  "0x" + byteArray.map((b) => b.toString(16).padStart(2, "0")).join("");

const gqlClient = new SuiGraphQLClient({
  url: `https://sui-${process.env.NETWORK!}.mystenlabs.com/graphql`,
});

const moveObjectDataQuery = graphql(`
  query getMoveObjectData($address: String!) {
    object(address: $address) {
      asMoveObject {
        contents {
          data
        }
      }
    }
  }
`);

const dynamicFieldsQuery = graphql(`
  query getDynamicFields($address: String!) {
    owner(address: $address) {
      dynamicFields {
        nodes {
          name {
            ... {
              type {
                repr
              }
              json
            }
          }
          value {
            __typename
            ... on MoveValue {
              ... {
                type {
                  repr
                }
                json
              }
            }
            ... on MoveObject {
              contents {
                ... {
                  type {
                    repr
                  }
                  json
                }
              }
            }
          }
        }
      }
    }
  }
`);

const extractOrderStatuses = (
  data: DynamicFieldResponse
): Map<string, OrderInfo["status"]> => {
  const statusMap = new Map<string, OrderInfo["status"]>();

  for (const node of data?.owner?.dynamicFields?.nodes ?? []) {
    const id = node.name?.json;
    const type = node.value?.type?.repr;
    const statusJson = node.value?.json;

    if (
      typeof id === "string" &&
      typeof type === "string" &&
      type.includes("::OrderStatus") &&
      statusJson &&
      typeof statusJson === "object"
    ) {
      const statusKey = Object.keys(statusJson)[0] as OrderInfo["status"];
      statusMap.set(id, statusKey);
    }
  }

  return statusMap;
};

const extractOrdersObjectId = (data: MoveObjectDataResponse): string | null => {
  const fields = data?.object?.asMoveObject?.contents?.data?.Struct;
  const ordersField = fields?.find((f) => f.name === "orders");
  const uid = ordersField?.value?.Struct?.find((s: any) => s.name === "id")
    ?.value?.UID;
  return uid ? toHexString(uid) : null;
};

const extractOrderAddresses = (data: DynamicFieldResponse): string[] => {
  return data?.owner?.dynamicFields?.nodes
    ?.map((node) => node.name?.json)
    .filter((id): id is string => Boolean(id));
};

const extractOrderInfo = (
  data: MoveObjectDataResponse
): PartialOrderInfo | null => {
  const fields = data?.object?.asMoveObject?.contents?.data?.Struct;
  if (!Array.isArray(fields)) return null;

  const orderIdField = fields.find((f) => f.name === "id");
  const placedByField = fields.find((f) => f.name === "placed_by");
  const placedAtField = fields.find((f) => f.name === "placed_at");
  const coffeeTypeField = fields.find((f) => f.name === "coffee_type");

  const coffeeType = coffeeTypeField?.value?.Variant?.name as
    | OrderInfo["coffeeType"]
    | undefined;

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
    return { orderId, placedBy, placedAt, coffeeType };
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

    const cafeResult = await gqlClient.query({
      query: moveObjectDataQuery,
      variables: { address: cafeAddress },
    });

    const ordersObjectId = extractOrdersObjectId(
      cafeResult.data as MoveObjectDataResponse
    );
    if (!ordersObjectId) throw new Error("Orders UID not found");

    const fieldsResult = await gqlClient.query({
      query: dynamicFieldsQuery,
      variables: { address: ordersObjectId },
    });

    const orderAddresses = extractOrderAddresses(
      fieldsResult.data as DynamicFieldResponse
    );
    const statusMap = extractOrderStatuses(
      fieldsResult.data as DynamicFieldResponse
    );

    const orders: OrderInfo[] = [];

    const CHUNK_SIZE = 5;
    for (let i = 0; i < orderAddresses.length; i += CHUNK_SIZE) {
      const chunk = orderAddresses.slice(i, i + CHUNK_SIZE);
      const results = await Promise.allSettled(
        chunk.map((address) =>
          gqlClient.query({
            query: moveObjectDataQuery,
            variables: { address },
          })
        )
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const address = chunk[j];

        if (result.status === "fulfilled") {
          const info = extractOrderInfo(
            result.value.data as MoveObjectDataResponse
          );
          const status = statusMap.get(address) ?? "Created";
          if (info) orders.push({ ...info, status });
        } else {
          console.error(`Failed to fetch order ${address}:`, result.reason);
        }
      }

      await new Promise((res) => setTimeout(res, 500)); // slight delay between chunks
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
