"use client";

import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type React from "react";
import { Toaster } from "react-hot-toast";
import { RegisterEnokiWallets } from "./RegisterEnokiWallets";

const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider
          networks={networkConfig}
          defaultNetwork={
            process.env.NEXT_PUBLIC_SUI_NETWORK_NAME! as "testnet" | "mainnet"
          }
        >
          <RegisterEnokiWallets />
          <WalletProvider autoConnect>
            <Toaster
              position="bottom-center"
              toastOptions={{
                duration: 5000,
              }}
            />
            {children}
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
