"use client";

import { CoffeeMenu } from "@/components/coffee-menu";
import { Header } from "@/components/header";
import { OrderTracking } from "@/components/order-tracking";
import { useOrder } from "@/hooks/useOrder";
import { ConnectButton } from "@mysten/dapp-kit";
import { Coffee } from "lucide-react";

export default function Home() {
  const {
    orders,
    isWalletConnected,
    walletAddress,
    handleOrderPlace,
    handleWalletDisconnect,
  } = useOrder();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
      <Header
        isWalletConnected={isWalletConnected}
        walletAddress={walletAddress}
        onWalletDisconnect={handleWalletDisconnect}
      />

      <main className="container mx-auto px-4 py-8">
        {!isWalletConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <div className="text-center space-y-4">
              <div className="relative">
                <Coffee className="h-16 w-16 text-blue-600 mx-auto" />
              </div>
              <h1 className="text-4xl font-bold text-blue-800 dark:text-blue-200">
                SuiHub Cafe
              </h1>
              <p className="text-lg text-blue-700 dark:text-blue-300 max-w-md">
                Connect your Sui wallet to order complimentary coffee beverages
                powered by Sui
              </p>
            </div>
            <ConnectButton />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-blue-800 dark:text-blue-200 mb-2">
                  Choose Your Coffee
                </h2>
              </div>
              <CoffeeMenu onOrderPlace={handleOrderPlace} />
            </div>

            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-blue-800 dark:text-blue-200 mb-2">
                  Your Orders
                </h2>
                <p className="text-blue-700 dark:text-blue-300">
                  Track your order status in real-time
                </p>
              </div>
              <OrderTracking orders={orders} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
