import { z } from "zod";

/*
 * The schema for the client-side environment variables
 * These variables should be defined in the app/.env file
 * These variables are NOT SECRET, they are exposed to the client side
 * They can and should be tracked by Git
 * All of the env variables must have the NEXT_PUBLIC_ prefix
 */

const clientConfigSchema = z.object({
  SUI_NETWORK: z.string(),
  SUI_GRAPHQL_NETWORK: z.string(),
  PACKAGE_ID: z.string(),
  NETWORK: z.enum(["mainnet", "testnet"]),
});

const clientConfig = clientConfigSchema.parse({
  SUI_NETWORK: process.env.NEXT_PUBLIC_SUI_NETWORK!,
  SUI_GRAPHQL_NETWORK: process.env.NEXT_PUBLIC_SUI_GRAPHQL_NETWORK!,
  PACKAGE_ID: process.env.NEXT_PUBLIC_PACKAGE!,
  NETWORK: process.env.NEXT_PUBLIC_NETWORK!,
});

export default clientConfig;
