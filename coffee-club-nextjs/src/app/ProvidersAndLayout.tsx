"use client";

import React from "react";
import { LargeScreenLayout } from "@/components/layouts/LargeScreenLayout";
import { ChildrenProps } from "@/types/ChildrenProps";
import { Toaster } from "react-hot-toast";
import { CustomWalletProvider } from "@/contexts/CustomWallet";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import "@mysten/dapp-kit/dist/index.css";
import clientConfig from "@/config/clientConfig";

// Config options for the networks you want to connect to
const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: clientConfig.SUI_NETWORK },
});

const queryClient = new QueryClient();

export const ProvidersAndLayout = ({ children }: ChildrenProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={networkConfig}
        defaultNetwork={clientConfig.NETWORK}
      >
        <WalletProvider autoConnect stashedWallet={{ name: "CoffeClub" }}>
          <CustomWalletProvider>
            <main className={`min-h-screen w-screen bg-[#030F1C]`}>
              <LargeScreenLayout>{children}</LargeScreenLayout>
              <Toaster
                position="bottom-center"
                toastOptions={{
                  duration: 5000,
                }}
              />
            </main>
          </CustomWalletProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
};
