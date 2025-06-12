import clientConfig from "@/config/clientConfig";
import { SuiLinkObject, SuiLinkObjectOnChain } from "@/types/SuiLinkObject";
import { SuiClient, SuiObjectResponse } from "@mysten/sui.js/dist/cjs/client";
import { formatSuiLinkObject } from "./formatSuiLinkObject";

const parseSuiObjectsResponse = (data: SuiObjectResponse[]) => {
  return data
    .filter(
      (datum: SuiObjectResponse) =>
        !!datum.data &&
        datum.data.type?.includes(
          `${clientConfig.PACKAGE_ID}::suilink::SuiLink<`
        )
    )
    .map((datum: SuiObjectResponse) =>
      formatSuiLinkObject(datum.data as unknown as SuiLinkObjectOnChain)
    );
};

/**
 * Fetches all owned SuiLinks for a given address
 * Automatically iterates through all pages of results
 */
export const getAllOwnedSuiLinks = async ({
  address,
  suiClient,
}: {
  address: string;
  suiClient: SuiClient;
}) => {
  const allOwnedSuiLinks: SuiLinkObject[] = [];

  let { data, nextCursor, hasNextPage } = await suiClient.getOwnedObjects({
    owner: address,
    options: {
      showContent: true,
      showType: true,
      showOwner: true,
      showPreviousTransaction: true,
    },
    filter: {
      MoveModule: {
        package: clientConfig.PACKAGE_ID,
        module: "suilink",
      },
    },
  });
  allOwnedSuiLinks.push(...parseSuiObjectsResponse(data));

  while (hasNextPage) {
    const resp = await suiClient.getOwnedObjects({
      owner: address,
      options: {
        showContent: true,
        showType: true,
        showOwner: true,
      },
      filter: {
        MoveModule: {
          package: clientConfig.PACKAGE_ID,
          module: "suilink",
        },
      },
      cursor: nextCursor,
    });
    allOwnedSuiLinks.push(...parseSuiObjectsResponse(resp.data));
    nextCursor = resp.nextCursor;
    hasNextPage = resp.hasNextPage;
  }

  return allOwnedSuiLinks;
};
