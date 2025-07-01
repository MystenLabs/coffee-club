import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";
import { useCallback, useEffect, useState } from "react";

let cachedOrdersObjectId: string | null = null;

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

interface OrderInfo {
  orderId: string;
  placedBy: string;
  placedAt: number;
  status: "Created" | "Processing" | "Completed" | "Cancelled";
  queuePosition?: number | null;
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

export const useGetOrdersByAddress = (address?: string) => {
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const gqlClient = new SuiGraphQLClient({
    url: `https://sui-${
      process.env.NEXT_PUBLIC_SUI_NETWORK_NAME! as "testnet" | "mainnet"
    }.mystenlabs.com/graphql`,
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
              type {
                repr
              }
              json
            }
            value {
              __typename
              ... on MoveValue {
                type {
                  repr
                }
                json
              }
              ... on MoveObject {
                contents {
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
  ): Omit<OrderInfo, "status"> | null => {
    const fields = node?.asMoveObject?.contents?.data?.Struct;
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

  const extractOrdersObjectId = (
    data: MoveObjectDataResponse
  ): string | null => {
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

  const reFetchData = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const cafeAddress = process.env.NEXT_PUBLIC_CAFE_ADDRESS!;

      if (!cachedOrdersObjectId) {
        const cafeResult = await gqlClient.query({
          query: moveObjectDataQuery,
          variables: { address: cafeAddress },
        });
        cachedOrdersObjectId = extractOrdersObjectId(
          cafeResult.data as MoveObjectDataResponse
        );
      }
      if (!cachedOrdersObjectId) throw new Error("Orders UID not found");

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
        setOrders([]);
        setIsError(false);
        return;
      }

      const multiObjectResult = await gqlClient.query({
        query: multiObjectQuery,
        variables: { addresses: orderAddresses },
      });

      if (multiObjectResult.errors) {
        throw new Error(
          multiObjectResult.errors.map((e) => e.message).join(", ")
        );
      }

      const fetchedOrders: OrderInfo[] = [];
      const orderNodes = multiObjectResult.data?.objects?.nodes ?? [];

      for (const node of orderNodes) {
        const info = extractOrderInfoFromNode(node as OrderObjectNode);
        const status = statusMap.get(node.address) ?? "Created";

        if (info) {
          fetchedOrders.push({ ...info, status });
        }
      }

      const sortedOrders = [...fetchedOrders].sort(
        (a, b) => a.placedAt - b.placedAt
      );
      // Assign queuePosition based on sorted order
      let queueCounter = 1;
      const ordersWithQueue = sortedOrders.map((order) => {
        if (order.status === "Completed" || order.status === "Cancelled") {
          return { ...order, queuePosition: undefined };
        }

        const orderWithQueue = {
          ...order,
          queuePosition: queueCounter,
        };
        queueCounter += 1; // 1-based index
        return orderWithQueue;
      });
      // Filter by address
      const filteredOrders = ordersWithQueue.filter(
        (order) => order.placedBy.toLowerCase() === address.toLowerCase()
      );

      // Orders are sorted in descending order
      const sortedFilteredOrders = [...filteredOrders].sort(
        (a, b) => b.placedAt - a.placedAt
      );

      setOrders(sortedFilteredOrders);
      setIsError(false);
    } catch (err) {
      console.error(err);
      setOrders([]);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (!address) return;

    reFetchData(); // initial fetch

    const interval = setInterval(() => {
      reFetchData();
    }, 5000); // every 5s

    return () => clearInterval(interval);
  }, [address, reFetchData]);

  return {
    orders,
    isLoading,
    isError,
    reFetchData,
  };
};
