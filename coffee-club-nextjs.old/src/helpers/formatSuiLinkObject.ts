import { SuiLinkObject, SuiLinkObjectOnChain } from "@/types/SuiLinkObject";

export const formatSuiLinkObject = (
  data: SuiLinkObjectOnChain
): SuiLinkObject => {
  const fields = data.content.fields;
  const owner = data.owner.AddressOwner;
  return {
    id: data.objectId,
    chain: data.type.includes("::ethereum::Ethereum>") ? "ethereum" : "solana",
    networkAddress: fields.network_address,
    createdAt: fields.timestamp_ms,
    suiAddress: owner,
    mintTransactionDigest: data.previousTransaction,
  };
};
