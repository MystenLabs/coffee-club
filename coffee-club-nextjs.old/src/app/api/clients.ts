import clientConfig from "@/config/clientConfig";
import { EnokiClient } from "@mysten/enoki";
import { SuiClient } from "@mysten/sui/client";

export const suiClient = new SuiClient({ url: clientConfig.SUI_NETWORK });
export const enokiClient = new EnokiClient({
  apiKey: process.env.ENOKI_SECRET_KEY!,
});
