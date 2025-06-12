import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ConnectOtherWallet } from "../claim/ConnectOtherWallet";
import { EthereumClaimFlow } from "../claim/EthereumClaimFlow";
import { SolanaClaimFlow } from "../claim/SolanaClaimFlow";
import { Drawer } from "../general/Drawer";
import SolanaProvider from "@/contexts/SolanaProvider";
import EthereumProvider from "@/contexts/EthereumProvider";

export const CreateSuiLinkDrawer = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const param = searchParams.get("create") || "";
    setIsOpen(["true", "ethereum", "solana"].includes(param));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("create")]);

  const handleClose = () => {
    router.push(pathname);
  };

  return (
    <Drawer isOpen={isOpen} handleClose={handleClose}>
      {searchParams.get("create") === "true" && (
        <ConnectOtherWallet
          ethereumHref="/suilinks?create=ethereum"
          solanaHref="/suilinks?create=solana"
          isInsideDrawer
        />
      )}
      {searchParams.get("create") === "ethereum" && (
        <EthereumProvider>
          <EthereumClaimFlow
            isInsideDrawer
            solanaHref={`${pathname}?create=solana`}
            onAllClaimed={handleClose}
          />
        </EthereumProvider>
      )}
      {searchParams.get("create") === "solana" && (
        <SolanaProvider>
          <SolanaClaimFlow
            isInsideDrawer
            ethereumHref={`${pathname}?create=ethereum`}
            onClaimSuccess={handleClose}
          />
        </SolanaProvider>
      )}
    </Drawer>
  );
};
