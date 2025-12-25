import {
  useCurrentAccount,
  useDisconnectWallet,
  useSignTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID, toB64 } from "@mysten/sui/utils";
import { useEffect, useMemo, useState } from "react";
import { useGetOrdersByAddress } from "./useGetOrdersByAddress";

export type CoffeeType =
  | "Espresso"
  | "Black Coffee"
  | "Cappuccino"
  | "Latte"
  | "Macchiato"
  | "Americano"
  | "Flat White"
  | "Cappuccino Doppio"
  | "Long"
  | "Hot Water";

export interface Order {
  id: string;
  coffee: CoffeeType;
  status: "Created" | "Processing" | "Completed" | "Cancelled";
  placedAt: Date;
  queuePosition?: number;
}

interface CreatedObjectChange {
  type: "created";
  sender: string;
  owner: { Shared: { initial_shared_version: number } };
  objectType: string;
  objectId: string;
  version: string;
  digest: string;
}

const COFFEE_TYPE_MAP_STORAGE_KEY = "coffeeTypeMap";

export function useOrder() {
  // State to store coffee type by order ID locally, as it's not on-chain
  const [localCoffeeTypeMap, setLocalCoffeeTypeMap] = useState<
    Map<string, CoffeeType>
  >(() => {
    if (typeof window !== "undefined") {
      const storedMap = localStorage.getItem(COFFEE_TYPE_MAP_STORAGE_KEY);
      return storedMap ? new Map(JSON.parse(storedMap)) : new Map();
    }
    return new Map();
  });

  // Save map to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        COFFEE_TYPE_MAP_STORAGE_KEY,
        JSON.stringify(Array.from(localCoffeeTypeMap.entries()))
      );
    }
  }, [localCoffeeTypeMap]);

  const { mutateAsync: signTransaction } = useSignTransaction();
  const { mutateAsync: disconnect } = useDisconnectWallet();
  const currentAccount = useCurrentAccount();
  const walletAddress = currentAccount?.address || "";
  const suiClient = useSuiClient();

  const {
    orders: fetchedRawOrders,
    isLoading: areOrdersLoading,
    reFetchData,
  } = useGetOrdersByAddress(walletAddress);

  // State for orders to allow for optimistic updates
  const [orders, setOrders] = useState<Order[]>([]);
  // State to track if a transaction is currently in-flight
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // useEffect to sync fetched orders from the hook to our local state
  useEffect(() => {
    if (!fetchedRawOrders) {
      setOrders([]);
      return;
    }
    const mappedOrders = fetchedRawOrders.map((rawOrder) => ({
      id: rawOrder.orderId,
      coffee:
        localCoffeeTypeMap.get(rawOrder.orderId) ||
        ("Unknown Coffee" as CoffeeType),
      status: rawOrder.status,
      placedAt: new Date(rawOrder.placedAt),
      queuePosition: rawOrder.queuePosition,
    }));
    setOrders(mappedOrders);
  }, [fetchedRawOrders, localCoffeeTypeMap]);

  const handleWalletDisconnect = () => {
    disconnect();
    // When wallet disconnects, clear local map as well
    setLocalCoffeeTypeMap(new Map());
  };

  const handleOrderPlace = async (coffee: CoffeeType): Promise<void> => {
    // Set loading state to true at the very beginning
    setIsPlacingOrder(true);
    try {
      const transaction = new Transaction();
      let coffeeTypeFunctionName: string | undefined;

      switch (coffee) {
        case "Espresso":
          coffeeTypeFunctionName = "espresso";
          break;
        case "Black Coffee":
          coffeeTypeFunctionName = "coffee";
          break;
        case "Long":
          coffeeTypeFunctionName = "long";
          break;
        case "Americano":
          coffeeTypeFunctionName = "americano";
          break;
        case "Cappuccino":
          coffeeTypeFunctionName = "cappuccino";
          break;
        case "Latte":
          coffeeTypeFunctionName = "latte";
          break;
        case "Macchiato":
          coffeeTypeFunctionName = "macchiato";
          break;
        case "Flat White":
          coffeeTypeFunctionName = "flat_white";
          break;
        case "Cappuccino Doppio":
          coffeeTypeFunctionName = "cappuccino_doppio";
          break;
        case "Hot Water":
          coffeeTypeFunctionName = "hotwater";
          break;
        default:
          console.error(`Coffee type '${coffee}' not implemented`);
          throw new Error(`Coffee type '${coffee}' not available.`);
      }

      const PACKAGE_ADDRESS = process.env.NEXT_PUBLIC_PACKAGE_ADDRESS!;
      const NETWORK_NAME = process.env.NEXT_PUBLIC_SUI_NETWORK_NAME!;
      const CAFE_ADDRESS = process.env.NEXT_PUBLIC_CAFE_ADDRESS!;

      const coffeeTypeArg = transaction.moveCall({
        target: `${PACKAGE_ADDRESS}::suihub_cafe::${coffeeTypeFunctionName}`,
      });

      transaction.moveCall({
        arguments: [
          transaction.object(CAFE_ADDRESS), // cafe: &mut SuiHubCafe
          coffeeTypeArg, // coffee_type: CoffeeType
          transaction.object(SUI_CLOCK_OBJECT_ID), // clock: &Clock
        ],
        target: `${PACKAGE_ADDRESS}::suihub_cafe::order_coffee`,
      });

      const txBytes = await transaction.build({
        client: suiClient,
        onlyTransactionKind: true,
      });

      const sponsoredRes = await fetch("/api/order/sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          network: NETWORK_NAME,
          sender: walletAddress,
          transactionKindBytes: toB64(txBytes),
          allowedMoveCallTargets: [
            `${PACKAGE_ADDRESS}::suihub_cafe::${coffeeTypeFunctionName}`,
            `${PACKAGE_ADDRESS}::suihub_cafe::order_coffee`,
          ],
          allowedAddresses: [walletAddress],
        }),
      });

      if (!sponsoredRes.ok) throw new Error("Sponsorship failed");
      const sponsored = (await sponsoredRes.json()).data;

      const { signature } = await signTransaction({
        transaction: sponsored.bytes,
      });
      if (!signature) throw new Error("Failed to sign sponsored transaction");

      const executeRes = await fetch(`/api/order/execute/${sponsored.digest}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
      });

      if (!executeRes.ok) throw new Error("Execution failed");
      const result = (await executeRes.json()).data;

      const waitForTX = await suiClient.waitForTransaction({
        digest: result.digest,
        options: { showEffects: true, showObjectChanges: true },
      });

      const createdOrder = waitForTX.objectChanges?.find(
        (o) =>
          o.type === "created" &&
          o.objectType.endsWith("suihub_cafe::CoffeeOrder")
      ) as CreatedObjectChange | undefined;

      if (createdOrder?.objectId) {
        // Store the coffee type locally, associated with the new order ID
        setLocalCoffeeTypeMap((prev) =>
          new Map(prev).set(createdOrder.objectId, coffee)
        );

        // Optimistic Update, add a temporary order object to our state immediately.
        const newOptimisticOrder: Order = {
          id: createdOrder.objectId,
          coffee: coffee,
          status: "Created",
          placedAt: new Date(),
          queuePosition: undefined,
        };
        setOrders((prev) => [...prev, newOptimisticOrder]);

        // Trigger a re-fetch of orders from the chain to include the newly placed order
        // A small delay allow indexers to catch up
        setTimeout(() => {
          reFetchData();
        }, 500); // Wait 500ms before re-fetching
      }
    } catch (error) {
      console.error("Order placement failed:", error);
      // Re-throw the error so the calling component can handle it
      throw error;
    } finally {
      // Set loading state to false in the finally block
      setIsPlacingOrder(false);
    }
  };

  const hasPendingOrder = useMemo(() => {
    // An order is pending if a transaction is in-flight OR if there's
    // any existing order that isn't 'Completed' or 'Cancelled'.
    return (
      isPlacingOrder ||
      orders.some(
        (order) => order.status === "Created" || order.status === "Processing"
      )
    );
  }, [orders, isPlacingOrder]);

  return {
    orders,
    isWalletConnected: !!currentAccount,
    walletAddress,
    handleOrderPlace,
    handleWalletDisconnect,
    areOrdersLoading,
    hasPendingOrder,
  };
}
