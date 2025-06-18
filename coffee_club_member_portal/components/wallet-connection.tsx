"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wallet, Loader2, Shield, Zap } from "lucide-react";

interface WalletConnectionProps {
  onConnect: (address: string) => void;
}

export function WalletConnection({ onConnect }: WalletConnectionProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);

    // Simulate wallet connection delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock wallet address generation
    const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`;

    setIsConnecting(false);
    onConnect(mockAddress);
  };

  return (
    <Card className="w-full max-w-md border-blue-200 dark:border-blue-800 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
          <Wallet className="h-8 w-8 text-blue-600" />
        </div>
        <CardTitle className="text-blue-800 dark:text-blue-200 text-xl">
          Connect Sui Wallet
        </CardTitle>
        {/* <CardDescription className="text-blue-600 dark:text-blue-400">
          Secure blockchain-powered coffee ordering experience
        </CardDescription> */}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* <div className="grid grid-cols-2 gap-4 text-center">
          <div className="flex flex-col items-center space-y-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <span className="text-xs text-blue-600 dark:text-blue-400">
              Secure
            </span>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <Zap className="h-5 w-5 text-blue-500" />
            <span className="text-xs text-blue-600 dark:text-blue-400">
              Fast
            </span>
          </div>
        </div> */}

        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
          size="lg"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting to Sui...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Sui Wallet
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
