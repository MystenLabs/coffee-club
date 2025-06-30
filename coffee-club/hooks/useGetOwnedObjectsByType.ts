import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";
import { useMemo, useState } from "react";

const ownedObjectsByType = graphql(`
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
          address
          version
          display {
            key
            value
          }
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
`);

export const useOwnedObjects = (
  ownerAddress: string,
  objectType: string,
  limit = 10,
  cursor = null
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const gqlClient = new SuiGraphQLClient({
    url: `https://sui-${
      process.env.NEXT_PUBLIC_SUI_NETWORK_NAME! as "testnet" | "mainnet"
    }.mystenlabs.com/graphql`,
  });

  const getOwnedObjectsByType = graphql(`
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
            address
            version
            display {
              key
              value
            }
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
  `);

  const data = await gqlClient.query({
    query: getOwnedObjectsByType,
    variables: { address: cafeAddress },
  });

  const objects = useMemo(() => {
    if (!data?.address?.objects?.nodes) return [];

    return data.address.objects.nodes
      .map((node) => node?.contents?.json)
      .filter(Boolean); // Ensure we only return non-null objects
  }, [data]);

  const pageInfo = data?.address?.objects?.pageInfo;

  return {
    objects,
    loading,
    error,
    pageInfo,
    fetchMore,
  };
};
