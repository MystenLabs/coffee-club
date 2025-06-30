import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

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

interface OrderObjectNode {
  address: string;
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
}

let cachedOrdersObjectId: string | null = null;

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

const multiObjectQuery = graphql(`
  query getMultipleObjects($addresses: [SuiAddress!]!) {
    objects(filter: { objectIds: $addresses }) {
      nodes {
        address
        asMoveObject {
          contents {
            data
          }
        }
      }
    }
  }
`);

const extractOrderInfoFromNode = (
  node: OrderObjectNode
): PartialOrderInfo | null => {
  const fields = node?.asMoveObject?.contents?.data?.Struct;
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

export const getAllOrders = async (): Promise<{
  orders: OrderInfo[];
  error?: string;
}> => {
  try {
    const cafeAddress = process.env.CAFE_ID;
    if (!cafeAddress) throw new Error("Missing cafe address in env");

    // 1. Check if we have cached the orders object ID
    if (!cachedOrdersObjectId) {
      const cafeResult = await gqlClient.query({
        query: moveObjectDataQuery,
        variables: { address: cafeAddress },
      });

      cachedOrdersObjectId = extractOrdersObjectId(
        cafeResult.data as MoveObjectDataResponse
      );

      if (!cachedOrdersObjectId) throw new Error("Orders UID not found");
    }

    // 2. Fetch all dynamic fields to get addresses and statuses (same as before)
    const fieldsResult = await gqlClient.query({
      query: dynamicFieldsQuery,
      variables: { address: cachedOrdersObjectId },
    });
    const orderAddresses = extractOrderAddresses(
      fieldsResult.data as DynamicFieldResponse
    );
    const statusMap = extractOrderStatuses(
      fieldsResult.data as DynamicFieldResponse
    );

    if (orderAddresses.length === 0) {
      return { orders: [] };
    }

    // 3. Fetch ALL order objects in a SINGLE query
    const multiObjectResult = await gqlClient.query({
      query: multiObjectQuery,
      variables: { addresses: orderAddresses },
    });

    if (multiObjectResult.errors) {
      throw new Error(
        multiObjectResult.errors.map((e) => e.message).join(", ")
      );
    }

    const orders: OrderInfo[] = [];
    const orderNodes = multiObjectResult.data?.objects?.nodes ?? [];

    // 4. Process the results from the single query
    for (const node of orderNodes) {
      const info = extractOrderInfoFromNode(node as OrderObjectNode);
      const status = statusMap.get(node.address) ?? "Created";

      if (info) {
        orders.push({ ...info, status });
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
