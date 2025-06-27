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
import { Switch } from "@/components/ui/switch";
import { useGetCafeStatus } from "@/hooks/useGetCafeStatus";
import {
  useCurrentAccount,
  useDisconnectWallet,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

export default function ManagerPage() {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const suiClient = useSuiClient();
  const { status, isLoading, refetch } = useGetCafeStatus();

  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();

  function handleToggleCafeStatus() {
    const PACKAGE_ADDRESS = process.env.NEXT_PUBLIC_PACKAGE_ADDRESS!;
    const CAFE_ADDRESS = process.env.NEXT_PUBLIC_CAFE_ADDRESS!;

    const transaction = new Transaction();

    transaction.moveCall({
      arguments: [
        transaction.object(CAFE_ADDRESS),
        transaction.object(
          "0x6922a016d03ad0648c8ec11a3640f4b02c053dd19e3b7cdea7eae90d1ce318c3"
        ),
      ],
      target: `${PACKAGE_ADDRESS}::suihub_cafe::toggle_cafe_status_by_manager`,
    });

    signAndExecute(
      { transaction },
      {
        onSuccess: async (tx) => {
          console.log("Cafe status toggled successfully!");
          await suiClient.waitForTransaction({ digest: tx.digest });
          refetch();
        },
        onError: (error) => {
          console.error("Failed to toggle cafe status:", error);
        },
      }
    );
  }

  const isCafeOpen = status === "Open";

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
            <CardTitle>Manager Panel</CardTitle>
            <CardDescription>Manage the SuiHub Cafe settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!currentAccount ? (
              <div className="text-center text-amber-600 dark:text-amber-400 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                Please connect your wallet to access the admin panel.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Cafe Status:{" "}
                    <span
                      className={`font-bold ${
                        isCafeOpen ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isLoading ? "Loading..." : (status ?? "Unknown")}
                    </span>
                  </span>
                  <Switch
                    checked={isCafeOpen} // Bind switch checked state to isCafeOpen
                    onCheckedChange={handleToggleCafeStatus} // Call the transaction on change
                    disabled={isPending || isLoading} // Disable while transaction is pending or status is loading
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={refetch} // Call refetch when this button is clicked
                  disabled={isLoading || isPending} // Disable button while fetching or transaction is pending
                >
                  Refresh Status
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
