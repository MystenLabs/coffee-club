"use client";

import { Coffee, Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

interface HeaderProps {
  isWalletConnected: boolean;
  walletAddress: string;
  onWalletDisconnect: () => void;
}

export function Header({
  isWalletConnected,
  walletAddress,
  onWalletDisconnect,
}: HeaderProps) {
  return (
    <header className="border-b border-blue-200 dark:border-blue-800 bg-white/90 dark:bg-blue-950/90 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Coffee className="h-8 w-8 text-blue-600" />
            {/* <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div> */}
          </div>
          <div>
            <span className="text-2xl font-bold text-blue-800 dark:text-blue-200">
              SuiHub Cafe
            </span>
            {/* <span className="text-sm text-blue-600 dark:text-blue-400 block leading-none">
              on Sui Network
            </span> */}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {isWalletConnected && (
            <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <Wallet className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onWalletDisconnect}
                className="h-6 w-6 p-0 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
