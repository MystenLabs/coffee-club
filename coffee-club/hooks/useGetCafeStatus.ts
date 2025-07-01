import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";
import { useCallback, useEffect, useState } from "react";

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

const getCafeStatus = (cafeResult: MoveObjectDataResponse): string | null => {
  const fields = cafeResult?.object?.asMoveObject?.contents?.data?.Struct;
  if (!Array.isArray(fields)) return null;

  const statusField = fields.find((f) => f.name === "status");
  return statusField?.value?.Variant?.name ?? null;
};

export const useGetCafeStatus = () => {
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const cafeAddress = process.env.NEXT_PUBLIC_CAFE_ADDRESS!;
      if (!cafeAddress) throw new Error("Missing cafe address in env");

      const cafeResult = await gqlClient.query({
        query: moveObjectDataQuery,
        variables: { address: cafeAddress },
      });

      const status = getCafeStatus(cafeResult.data as MoveObjectDataResponse);
      setStatus(status);
      setIsError(false);
    } catch (err) {
      console.error("Failed to fetch cafe status:", err);
      setStatus(null);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    isLoading,
    isError,
    refetch: fetchStatus,
  };
};
