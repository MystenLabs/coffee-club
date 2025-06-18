import { EnokiClient } from "@mysten/enoki";

export const enokiClient = new EnokiClient({
  apiKey: "enoki_private_ab024e4203222efb8a7e24b3b6c632a8",
  //   apiKey: process.env.ENOKI_SECRET_KEY!,
});
