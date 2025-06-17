"use client";

import { useState } from "react";
import { WalletConnection } from "@/components/wallet-connection";
import { CoffeeMenu } from "@/components/coffee-menu";
import { OrderTracking } from "@/components/order-tracking";
import { Header } from "@/components/header";
import { Coffee } from "lucide-react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

export type CoffeeType =
  | "Espresso"
  | "Americano"
  | "Doppio"
  | "Long"
  | "HotWater"
  | "Coffee";

export interface Order {
  id: string;
  coffee: CoffeeType;
  status: "Created" | "Processing" | "Completed";
  timestamp: Date;
}

export default function Home() {
  const currentAccount = useCurrentAccount();

  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);

  const handleWalletConnect = (address: string) => {
    setIsWalletConnected(true);
    setWalletAddress(address);
  };

  const handleWalletDisconnect = () => {
    setIsWalletConnected(false);
    setWalletAddress("");
    setOrders([]);
  };

  const handleOrderPlace = (coffee: CoffeeType) => {
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      coffee,
      status: "Created",
      timestamp: new Date(),
    };

    setOrders((prev) => [newOrder, ...prev]);

    // Simulate order processing
    setTimeout(() => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === newOrder.id ? { ...order, status: "Processing" } : order
        )
      );
    }, 2000);

    setTimeout(() => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === newOrder.id ? { ...order, status: "Completed" } : order
        )
      );
    }, 8000);
  };

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
                {/* <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div> */}
              </div>
              <h1 className="text-4xl font-bold text-blue-800 dark:text-blue-200">
                SuiHub Cafe
              </h1>
              <p className="text-lg text-blue-700 dark:text-blue-300 max-w-md">
                Connect your Sui wallet to order complimentary coffee beverages
                powered by Sui
              </p>
            </div>
            {/* <WalletConnection onConnect={handleWalletConnect} /> */}
            <ConnectButton />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <h2 className="text-3xl font-bold text-blue-800 dark:text-blue-200 mb-2">
                  Choose Your Coffee
                </h2>
                {/* <p className="text-blue-700 dark:text-blue-300">
                  Select from our premium collection of complimentary beverages
                </p> */}
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
