import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";
import { useCallback, useEffect, useState } from "react";

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

export const useGetOrderStatus = (address?: string) => {
  const [status, setStatus] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

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

  const reFetchData = useCallback(async () => {
    if (!address) return;

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

  // Fetch once on mount + poll every 10 seconds
  useEffect(() => {
    if (!address) return;

    reFetchData(); // initial fetch

    const interval = setInterval(() => {
      reFetchData();
    }, 10000); // every 10s

    return () => clearInterval(interval);
  }, [address, reFetchData]);

  return {
    status,
    isLoading,
    isError,
    reFetchData,
  };
};

function extractStatus(data: StatusResponse): string | undefined {
  const structFields = data?.object?.asMoveObject?.contents?.data?.Struct;

  if (!Array.isArray(structFields)) {
    return undefined;
  }

  const statusField = structFields.find((field) => field.name === "status");
  return statusField?.value?.Variant?.name;
}
