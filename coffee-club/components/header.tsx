"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Coffee, LogOut, Menu, Wallet, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

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
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    toast.success("Address copied!");
  };

  function truncateMiddle(str: string, front = 6, back = 4): string {
    if (str.length <= front + back + 3) return str;
    return `${str.slice(0, front)}...${str.slice(-back)}`;
  }

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

        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-blue-800 dark:text-blue-200"
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </Button>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          {isWalletConnected && (
            <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <Wallet className="h-4 w-4 text-blue-600" />
              <button
                onClick={handleCopy}
                className="text-sm font-medium text-blue-800 dark:text-blue-200 hover:underline focus:outline-none"
                title="Click to copy full address"
              >
                {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
              </button>
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

      {menuOpen && (
        <div className="md:hidden px-4 pb-4">
          <div className="flex flex-col space-y-4 mt-2">
            {isWalletConnected && (
              <div className="flex flex-col space-y-2 bg-blue-100 dark:bg-blue-900 px-4 py-3 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <Wallet className="h-4 w-4 text-blue-600" />
                  <button
                    onClick={handleCopy}
                    className="text-sm font-medium text-blue-800 dark:text-blue-200 focus:outline-none hover:underline"
                    title={walletAddress}
                  >
                    {truncateMiddle(walletAddress, 16, 16)}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between space-x-4">
              <ThemeToggle />
              {isWalletConnected && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onWalletDisconnect}
                  className="h-8 w-8 p-0 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full text-blue-800 dark:text-blue-200"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
