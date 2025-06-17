"use client";

import { CoffeeMenu } from "@/components/coffee-menu";
import { Header } from "@/components/header";
import { OrderTracking } from "@/components/order-tracking";
import {
  ConnectButton,
  useCurrentAccount,
  useDisconnectWallet,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";
import { Coffee } from "lucide-react";
import { useState } from "react";

export type CoffeeType =
  | "Espresso"
  | "Black Coffee"
  | "Cappuccino"
  | "Latte"
  | "Macchiato"
  | "Americano"
  | "Flat White"
  | "Cappuccino Doppio"
  | "Long";

export interface Order {
  id: string;
  coffee: CoffeeType;
  status: "Created" | "Processing" | "Completed";
  timestamp: Date;
}

export interface CoffeeInfo {
  name: CoffeeType;
  available: boolean;
}

interface CreatedObjectChange {
  type: "created";
  sender: string;
  owner: {
    Shared: {
      initial_shared_version: number;
    };
  };
  objectType: string;
  objectId: string;
  version: string;
  digest: string;
}

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);

  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();
  const { mutateAsync: disconnect } = useDisconnectWallet();
  const currentAccount = useCurrentAccount();
  const isWalletConnected = !!currentAccount;
  const walletAddress = currentAccount?.address || "";

  const suiClient = useSuiClient();

  const handleWalletDisconnect = () => {
    disconnect();
    setOrders([]);
  };

  const handleOrderPlace = async (coffee: CoffeeType): Promise<void> => {
    const tx = new Transaction();

    let coffeeTypeArgument;
    switch (coffee) {
      case "Espresso":
        coffeeTypeArgument = tx.moveCall({
          target: `0x06e9bd0f3c8cc115b82c966a7326f8b508ef8ccec3afe2555736fbf4d03ab453::suihub_cafe::espresso`,
        });
        break;
      case "Black Coffee":
        coffeeTypeArgument = tx.moveCall({
          target: `0x06e9bd0f3c8cc115b82c966a7326f8b508ef8ccec3afe2555736fbf4d03ab453::suihub_cafe::coffee`,
        });
        break;
      case "Long":
        coffeeTypeArgument = tx.moveCall({
          target: `0x06e9bd0f3c8cc115b82c966a7326f8b508ef8ccec3afe2555736fbf4d03ab453::suihub_cafe::long`,
        });
        break;
      case "Americano":
        coffeeTypeArgument = tx.moveCall({
          target: `0x06e9bd0f3c8cc115b82c966a7326f8b508ef8ccec3afe2555736fbf4d03ab453::suihub_cafe::americano`,
        });
        break;
      default:
        console.error(
          `Coffee type '${coffee}' not implemented in handleOrderPlace`
        );
        throw new Error(`Coffee type '${coffee}' not available for ordering.`);
    }

    tx.moveCall({
      arguments: [coffeeTypeArgument, tx.object(SUI_CLOCK_OBJECT_ID)],
      target: `0x06e9bd0f3c8cc115b82c966a7326f8b508ef8ccec3afe2555736fbf4d03ab453::suihub_cafe::test_order_coffee`,
    });

    try {
      const { digest } = await signAndExecuteTransaction({ transaction: tx });

      const res = await suiClient.waitForTransaction({
        digest: digest,
        options: {
          showRawEffects: true,
          showEffects: true,
          showObjectChanges: true,
          showEvents: false,
        },
      });
      console.log(res);
      const createdObj = res.effects?.created?.[0]?.reference?.objectId;
      console.log(createdObj);

      const createdOrder = res.objectChanges?.find(
        (o) =>
          o.type === "created" &&
          o.objectType.endsWith("suihub_cafe::TestCoffeeOrder")
      ) as CreatedObjectChange | undefined;

      console.log("createdOrder: ", createdOrder?.objectId);

      if (createdOrder?.objectId) {
        const newOrder: Order = {
          id: createdOrder.objectId,
          coffee,
          status: "Created",
          timestamp: new Date(),
        };

        setOrders((prev) => [newOrder, ...prev]);
      }
    } catch (error) {
      console.error("Transaction failed or was cancelled:", error);
      throw error;
    }
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
