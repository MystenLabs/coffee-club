import React, { useState } from "react";
import { Button } from "../ui/button";
import { ConnectModal } from "@mysten/dapp-kit";

export const ConnectSuiWalletButton = () => {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  return (
    <ConnectModal
      open={isConnectModalOpen}
      trigger={
        <Button onClick={() => setIsConnectModalOpen(true)}>
          Connect Sui Wallet
        </Button>
      }
      onOpenChange={(open) => {
        if (!open) setIsConnectModalOpen(false);
      }}
    />
  );
};
