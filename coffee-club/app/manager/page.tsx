"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useCurrentAccount,
  useDisconnectWallet,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

export default function AdminPage() {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const suiClient = useSuiClient();
  const {
    mutate: signAndExecute,
    isSuccess,
    isPending,
  } = useSignAndExecuteTransaction();

  function handleToggleCafeStatus() {
    const PACKAGE_ADDRESS = process.env.NEXT_PUBLIC_PACKAGE_ADDRESS!;
    const CAFE_ADDRESS = process.env.NEXT_PUBLIC_CAFE_ADDRESS!;

    const transaction = new Transaction();

    console.log("Toggling cafe status...");

    transaction.moveCall({
      arguments: [
        transaction.object(CAFE_ADDRESS), // cafe: &mut SuiHubCafe
        transaction.object(
          "0x6922a016d03ad0648c8ec11a3640f4b02c053dd19e3b7cdea7eae90d1ce318c3"
        ), // owner: &CafeOwner
      ],
      target: `${PACKAGE_ADDRESS}::suihub_cafe::toggle_cafe_status_by_manager`,
    });

    signAndExecute(
      {
        transaction,
      },
      {
        onSuccess: (transaction) => {
          console.log("Cafe status toggled successfully!");
          suiClient
            .waitForTransaction({ digest: transaction.digest })
            .then(async () => {});
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
      <Header
        isWalletConnected={!!currentAccount}
        walletAddress={currentAccount?.address || ""}
        onWalletDisconnect={() => disconnect()}
      />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Admin Panel</CardTitle>
            <CardDescription>Manage the SuiHub Cafe settings.</CardDescription>
          </CardHeader>
          <CardContent>
            {!currentAccount ? (
              <div className="text-center text-amber-600 dark:text-amber-400 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                Please connect your wallet to access the admin panel.
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleToggleCafeStatus()}
              >
                Toggle Cafe Status
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
