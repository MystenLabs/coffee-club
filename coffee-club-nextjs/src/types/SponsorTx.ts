import { EnokiNetwork } from "@mysten/enoki";

export interface SponsorTxRequestBody {
  network: EnokiNetwork;
  txBytes: string;
  sender: string;
  allowedMoveCallTargets?: string[];
  allowedAddresses?: string[];
}
