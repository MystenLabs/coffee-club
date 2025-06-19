import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";
import { useCallback, useEffect, useState } from "react";

interface OrderInfo {
  orderId: string;
  placedBy: string;
  placedAt: string;
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

export const useGetOrdersByAddress = (address?: string) => {
  const [orders, setOrders] = useState<OrderInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

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
    const placedAt = placedAtField?.value?.Number;

    if (orderId && placedBy && placedAt) {
      return {
        orderId,
        placedBy,
        placedAt,
      };
    }

    return null;
  };

  const reFetchData = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const result = await gqlClient.query({
        query: cafeStatusQuery,
        variables: { address: process.env.NEXT_PUBLIC_CAFE_ADDRESS! },
      });

      const orderIds = extractOrderQueueIds(result.data as CafeStatusResponse);

      const orderInfoList: OrderInfo[] = [];

      for (const orderId of orderIds) {
        try {
          const orderResult = await gqlClient.query({
            query: orderQuery,
            variables: { address: orderId },
          });

          const info = extractOrderInfo(orderResult.data as CafeStatusResponse);
          if (info) {
            orderInfoList.push(info);
          }
        } catch (err) {
          console.error(`Failed to fetch order ${orderId}:`, err);
        }
      }

      const filteredOrders = orderInfoList.filter(
        (order) => order.placedBy.toLowerCase() === address.toLowerCase()
      );

      setOrders(filteredOrders);
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
