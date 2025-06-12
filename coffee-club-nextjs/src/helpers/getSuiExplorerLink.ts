import clientConfig from "@/config/clientConfig";

interface GetSuiExplorerLinkProps {
  type: "object" | "address";
  objectId: string;
}

export const getSuiExplorerLink = ({
  type,
  objectId,
}: GetSuiExplorerLinkProps) => {
  const baseUrl = `${
    clientConfig.NETWORK === "testnet" ? "testnet." : ""
  }suivision.xyz/`;
  const URLType = type === "address" ? "account/" : "object/";
  const href = `https://${baseUrl}/${URLType}/${objectId}`;
  return href;
};
