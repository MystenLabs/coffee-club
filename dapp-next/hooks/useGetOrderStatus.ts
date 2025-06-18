import { useCallback, useEffect, useState } from "react";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";

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

export const useGetObjectStatus = (address?: string) => {
  const [status, setStatus] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const gqlClient = new SuiGraphQLClient({
    url: "https://sui-testnet.mystenlabs.com/graphql",
  });

  const reFetchData = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);

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
    if (address) {
      reFetchData();
    } else {
      setStatus(undefined);
      setIsError(false);
      setIsLoading(false);
    }
  }, [address, reFetchData]);

  return {
    status,
    isLoading,
    isError,
    reFetchData,
  };
};

function extractStatus(data: StatusResponse): string | undefined {
  const structFields = data.object.asMoveObject?.contents?.data?.Struct;
  const statusField = structFields.find((field) => field.name === "status");

  return statusField?.value?.Variant?.name;
}
