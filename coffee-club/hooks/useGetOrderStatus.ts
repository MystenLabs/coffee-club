import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";
import { useCallback, useEffect, useRef, useState } from "react";

const gqlClient = new SuiGraphQLClient({
  url: "https://sui-testnet.mystenlabs.com/graphql",
});

const statusQuery = graphql(`
  query getStatus($address: String!) {
    object(address: $address) {
      asMoveObject {
        contents {
          data
        }
      }
    }
  }
`);

interface StatusResponse {
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

function extractStatus(data: StatusResponse): string | undefined {
  const structFields = data?.object?.asMoveObject?.contents?.data?.Struct;
  const statusField = structFields?.find((f) => f.name === "status");
  return statusField?.value?.Variant?.name;
}

export const useGetOrderStatus = (address?: string) => {
  const [status, setStatus] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reFetchData = useCallback(async () => {
    if (!address) return;

    setIsError(false);
    setIsLoading(true);
    try {
      const result = await gqlClient.query({
        query: statusQuery,
        variables: { address },
      });

      const extractedStatus = extractStatus(result.data as StatusResponse);
      setStatus(extractedStatus);
      setIsError(false);
    } catch (err) {
      console.error(err);
      setStatus(undefined);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (!address) return;

    reFetchData(); // Initial fetch

    intervalRef.current = setInterval(reFetchData, 10_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [address, reFetchData]);

  return {
    status,
    isLoading,
    isError,
    reFetchData,
  };
};
