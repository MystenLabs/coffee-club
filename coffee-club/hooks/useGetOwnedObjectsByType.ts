import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";
import { useEffect, useMemo, useState } from "react";

const GET_OWNED_OBJECTS_BY_TYPE = graphql(`
  query getOwnedObjectsByType(
    $ownerAddress: SuiAddress!
    $objectType: String!
    $limit: Int = 10
    $cursor: String
  ) {
    address(address: $ownerAddress) {
      objects(first: $limit, after: $cursor, filter: { type: $objectType }) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          contents {
            json
          }
        }
      }
    }
  }
`);

type CafeManager = {
  id: string;
  manager_address: string;
  cafe_id: string;
};

export const useOwnedObjects = (
  ownerAddress: string,
  objectType: string,
  limit = 10,
  cursor: string | null = null
) => {
  const [data, setData] = useState<CafeManager[]>([]);
  const [pageInfo, setPageInfo] = useState<{
    hasNextPage: boolean;
    endCursor: string | null;
  }>({
    hasNextPage: false,
    endCursor: null,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const gqlClient = useMemo(() => {
    return new SuiGraphQLClient({
      url: `https://sui-${
        process.env.NEXT_PUBLIC_SUI_NETWORK_NAME! as "testnet" | "mainnet"
      }.mystenlabs.com/graphql`,
    });
  }, []);

  useEffect(() => {
    const fetchObjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await gqlClient.query({
          query: GET_OWNED_OBJECTS_BY_TYPE,
          variables: { ownerAddress, objectType, limit, cursor },
        });

        const nodes = response?.data?.address?.objects?.nodes ?? [];

        const extracted: CafeManager[] = nodes
          .map((node) => node?.contents?.json)
          .filter(Boolean)
          .map((json: any) => ({
            id: json.id,
            manager_address: json.manager_address,
            cafe_id: json.cafe_id,
          }));

        setData(extracted);
        setPageInfo(
          response?.data?.address?.objects?.pageInfo || {
            hasNextPage: false,
            endCursor: null,
          }
        );
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchObjects();
  }, [gqlClient, ownerAddress, objectType, limit, cursor]);

  return {
    objects: data,
    loading,
    error,
    pageInfo,
  };
};
