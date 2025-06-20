import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

interface OrderInfo {
  orderId: string;
  placedBy: string;
  placedAt: number;
}

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
  url: "https://sui-testnet.mystenlabs.com/graphql",
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

const extractOrderInfo = (data: MoveObjectDataResponse): OrderInfo | null => {
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

    // Step 1: Get cafe object
    const cafeResult = await gqlClient.query({
      query: moveObjectDataQuery,
      variables: { address: cafeAddress },
    });

    // Step 2: Extract `orders` object ID
    const ordersObjectId = extractOrdersObjectId(
      cafeResult.data as MoveObjectDataResponse
    );
    if (!ordersObjectId) throw new Error("Orders UID not found");

    // Step 3: Query dynamic fields of the orders object
    const fieldsResult = await gqlClient.query({
      query: dynamicFieldsQuery,
      variables: { address: ordersObjectId },
    });

    // Step 4: Extract addresses from name.json
    const orderAddresses = extractOrderAddresses(
      fieldsResult.data as DynamicFieldResponse
    );
    console.log("Order addresses:", orderAddresses);

    const orders: OrderInfo[] = [];

    for (const orderAddress of orderAddresses) {
      try {
        const orderResult = await gqlClient.query({
          query: moveObjectDataQuery,
          variables: { address: orderAddress },
        });

        const info = extractOrderInfo(
          orderResult.data as MoveObjectDataResponse
        );
        if (info) orders.push(info);
      } catch (err) {
        console.error(`Failed to fetch order ${orderAddress}:`, err);
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
