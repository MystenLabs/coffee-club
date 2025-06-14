// multiple types that are defined in the @mysten/enoki/dist/cjs/...
// so we re-define them here, to avoid importing from dist

export type EnokiNetwork = "mainnet" | "testnet" | "devnet";

export interface CreateSponsoredTransactionBlockApiResponse {
  bytes: string;
  digest: string;
}

export interface ExecuteSponsoredTransactionBlockApiInput {
  digest: string;
  signature: string;
}
