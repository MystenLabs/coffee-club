import { useState } from "react";
import { Wallet, Coffee, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WalletConnectionProps {
  onConnect: (address: string) => void;
}

const WalletConnection = ({ onConnect }: WalletConnectionProps) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);

    // Simulate wallet connection (in real app, integrate with Sui wallet)
    setTimeout(() => {
      const mockAddress = "0x1234567890abcdef1234567890abcdef12345678";
      onConnect(mockAddress);
      setIsConnecting(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="mb-8">
        <div className="bg-amber-600 p-4 rounded-full inline-block mb-4">
          <Coffee className="h-12 w-12 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-amber-900 mb-4">
          Welcome to SuiCoffee
        </h2>
        <p className="text-xl text-amber-700 max-w-2xl">
          Connect your Sui wallet to order your free coffee on Sui
        </p>
      </div>

      <Card className="w-full max-w-md border-amber-200 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Wallet className="h-5 w-5 text-amber-600" />
            <span>Connect Wallet</span>
          </CardTitle>
          <CardDescription>
            Connect your Sui wallet to start ordering
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center space-y-2">
              <Shield className="h-8 w-8 text-green-600" />
              <span className="text-sm font-medium">Secure</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Zap className="h-8 w-8 text-blue-600" />
              <span className="text-sm font-medium">Fast</span>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <Coffee className="h-8 w-8 text-amber-600" />
              <span className="text-sm font-medium">Free</span>
            </div>
          </div>

          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3"
          >
            {isConnecting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Connecting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Wallet className="h-4 w-4" />
                <span>Connect Sui Wallet</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletConnection;
