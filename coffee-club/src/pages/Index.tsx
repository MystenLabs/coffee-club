
import { useState } from "react";
import { Coffee, Wallet, CheckCircle, Clock } from "lucide-react";
import CoffeeMenu from "@/components/CoffeeMenu";
import WalletConnection from "@/components/WalletConnection";
import OrderConfirmation from "@/components/OrderConfirmation";

const Index = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [selectedCoffee, setSelectedCoffee] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  const handleWalletConnect = (address: string) => {
    setIsWalletConnected(true);
    setWalletAddress(address);
  };

  const handleCoffeeSelect = (coffee: any) => {
    setSelectedCoffee(coffee);
  };

  const handleOrderPlace = () => {
    setOrderPlaced(true);
  };

  const handleNewOrder = () => {
    setOrderPlaced(false);
    setSelectedCoffee(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-amber-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-600 p-2 rounded-full">
              <Coffee className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-amber-900">SuiCoffee</h1>
          </div>
          
          {isWalletConnected && (
            <div className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-full">
              <Wallet className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {!isWalletConnected ? (
          <WalletConnection onConnect={handleWalletConnect} />
        ) : orderPlaced ? (
          <OrderConfirmation 
            coffee={selectedCoffee}
            onNewOrder={handleNewOrder}
          />
        ) : (
          <CoffeeMenu 
            onCoffeeSelect={handleCoffeeSelect}
            selectedCoffee={selectedCoffee}
            onOrderPlace={handleOrderPlace}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-amber-900 text-amber-100 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Coffee className="h-5 w-5" />
            <span className="font-semibold">SuiCoffee</span>
          </div>
          <p className="text-sm opacity-80">
            Decentralized coffee ordering on the Sui blockchain
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
