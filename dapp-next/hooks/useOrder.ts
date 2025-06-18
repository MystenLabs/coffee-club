// File: hooks/useOrder.ts
import { useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID, toB64 } from "@mysten/sui/utils";
import {
  useCurrentAccount,
  useSignTransaction,
  useSuiClient,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { enokiClient } from "@/app/api/clients";

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

export function useOrder() {
  const [orders, setOrders] = useState<Order[]>([]);

  const { mutateAsync: signTransaction } = useSignTransaction();
  const { mutateAsync: disconnect } = useDisconnectWallet();
  const currentAccount = useCurrentAccount();
  const walletAddress = currentAccount?.address || "";
  const suiClient = useSuiClient();

  const handleWalletDisconnect = () => {
    disconnect();
    setOrders([]);
  };

  const handleOrderPlace = async (coffee: CoffeeType): Promise<void> => {
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
      default:
        console.error(`Coffee type '${coffee}' not implemented`);
        throw new Error(`Coffee type '${coffee}' not available.`);
    }

    const PACKAGE_ADDRESS = process.env.NEXT_PUBLIC_PACKAGE_ADDRESS!;
    const NETWORK_NAME = process.env.NEXT_PUBLIC_SUI_NETWORK_NAME!;

    const coffeeTypeArg = transaction.moveCall({
      target: `${PACKAGE_ADDRESS}::suihub_cafe::${coffeeTypeFunctionName}`,
    });

    transaction.moveCall({
      arguments: [coffeeTypeArg, transaction.object(SUI_CLOCK_OBJECT_ID)],
      target: `${PACKAGE_ADDRESS}::suihub_cafe::test_order_coffee`,
    });

    const txBytes = await transaction.build({
      client: suiClient,
      onlyTransactionKind: true,
    });

    const sponsored = await enokiClient.createSponsoredTransaction({
      network: NETWORK_NAME as "mainnet" | "testnet",
      transactionKindBytes: toB64(txBytes),
      sender: walletAddress,
      allowedMoveCallTargets: [
        `${PACKAGE_ADDRESS}::suihub_cafe::${coffeeTypeFunctionName}`,
        `${PACKAGE_ADDRESS}::suihub_cafe::test_order_coffee`,
      ],
      allowedAddresses: [walletAddress],
    });

    const { signature } = await signTransaction({
      transaction: sponsored.bytes,
    });
    if (!signature) throw new Error("Failed to sign sponsored transaction");

    const result = await enokiClient.executeSponsoredTransaction({
      digest: sponsored.digest,
      signature,
    });

    console.log("Transaction success:", result);

    // Add a mock order (you can replace this with actual returned data)
    const newOrder: Order = {
      id: sponsored.digest,
      coffee,
      status: "Created",
      timestamp: new Date(),
    };

    setOrders((prev) => [newOrder, ...prev]);
  };

  return {
    orders,
    isWalletConnected: !!currentAccount,
    walletAddress,
    handleOrderPlace,
    handleWalletDisconnect,
  };
}
