import { createContext, useContext } from "react";
import { ChildrenProps } from "@/types/ChildrenProps";
import { Transaction } from "@mysten/sui/transactions";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  SuiTransactionBlockResponse,
  SuiTransactionBlockResponseOptions,
} from "@mysten/sui/client";
import {
  CreateSponsoredTransactionBlockApiResponse,
  EnokiNetwork,
  ExecuteSponsoredTransactionBlockApiInput,
} from "@/types/Enoki";
import { fromB64, toB64 } from "@mysten/sui/utils";
import axios, { AxiosError, AxiosResponse } from "axios";
import clientConfig from "@/config/clientConfig";
// import { useGetOwnedLinks } from "@/hooks/useGetOwnedLinks";
// import { SuiLinkObject } from "@/types/SuiLinkObject";
import {
  useCurrentAccount,
  useCurrentWallet,
  useDisconnectWallet,
  useSignTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { SponsorTxRequestBody } from "@/types/SponsorTx";

interface SponsorAndExecuteTransactionBlockProps {
  tx: Transaction;
  network: EnokiNetwork;
  options: SuiTransactionBlockResponseOptions;
  allowedAddresses?: string[];
  allowedMoveCallTargets?: string[];
  recaptchaToken: string;
  action: string;
}

interface ExecuteTransactionBlockWithoutSponsorshipProps {
  tx: Transaction;
  options: SuiTransactionBlockResponseOptions;
}

interface CustomWalletContextProps {
  isSuiConnected: boolean;
  isSuiConnecting: boolean;
  suiAddress?: string;
  sponsorAndExecuteTransactionBlock: (
    props: SponsorAndExecuteTransactionBlockProps
  ) => Promise<SuiTransactionBlockResponse | void>;
  executeTransactionBlockWithoutSponsorship: (
    props: ExecuteTransactionBlockWithoutSponsorshipProps
  ) => Promise<SuiTransactionBlockResponse | void>;
  suiLogout: () => void;
  //   ownedLinks: SuiLinkObject[];
  //   areOwnedLinksLoading: boolean;
  //   fetchOwnedLinks: () => Promise<void | SuiLinkObject[]>;
}

export const useCustomWallet = () => {
  return useContext(CustomWalletContext);
};

export const CustomWalletContext = createContext<CustomWalletContextProps>({
  isSuiConnected: false,
  isSuiConnecting: false,
  suiAddress: undefined,
  sponsorAndExecuteTransactionBlock: async () => {},
  executeTransactionBlockWithoutSponsorship: async () => {},
  suiLogout: () => {},
  //   ownedLinks: [],
  //   areOwnedLinksLoading: true,
  //   fetchOwnedLinks: async () => [],
});

export const CustomWalletProvider = ({ children }: ChildrenProps) => {
  const suiClient = useSuiClient();
  const router = useRouter();
  const pathname = usePathname();

  const { isConnected: isWalletKitConnected, isConnecting: isSuiConnecting } =
    useCurrentWallet();
  const currentWalletKitAccount = useCurrentAccount();
  const { mutate: walletKitDisconnect } = useDisconnectWallet();
  const { mutateAsync: walletKitSignTransactionBlock } = useSignTransaction();

  //   const {
  //     ownedLinks,
  //     isLoading: areOwnedLinksLoading,
  //     fetchOwnedLinks,
  //   } = useGetOwnedLinks(currentWalletKitAccount?.address);

  // the only page that not-connected user can visit is the landing & the terms page
  // TODO: handle this redirection in a more elegant way
  useEffect(() => {
    if (
      !currentWalletKitAccount?.address &&
      !isSuiConnecting &&
      pathname !== "/terms"
    ) {
      router.push("/" + window.location.hash || "");
    }
  }, [currentWalletKitAccount?.address, isSuiConnecting, router, pathname]);

  const signTransactionBlock = async (bytes: Uint8Array): Promise<string> => {
    const txBlock = Transaction.from(bytes);
    return walletKitSignTransactionBlock({
      transaction: txBlock,
      chain: `sui:${clientConfig.NETWORK}`,
    }).then((resp) => resp.signature);
  };

  const sponsorAndExecuteTransactionBlock = async ({
    tx,
    network,
    options,
    allowedAddresses = [],
    allowedMoveCallTargets = [],
    recaptchaToken,
    action,
  }: SponsorAndExecuteTransactionBlockProps): Promise<SuiTransactionBlockResponse | void> => {
    if (!isWalletKitConnected) {
      console.error("Wallet is not connected");
      toast.error("Wallet is not connected");
      return;
    }
    try {
      // Sponsorship will happen in the back-end
      console.log("Sponsorship in the back-end...");
      const txBytes = await tx.build({
        client: suiClient,
        onlyTransactionKind: true,
      });
      const sponsorTxBody: SponsorTxRequestBody = {
        network,
        txBytes: toB64(txBytes),
        sender: currentWalletKitAccount?.address!,
        allowedMoveCallTargets,
        allowedAddresses,
        action,
      };
      console.log("Sponsoring transaction block...");
      const sponsorResponse: AxiosResponse<CreateSponsoredTransactionBlockApiResponse> =
        await axios.post("/api/sponsor", sponsorTxBody);
      const { bytes, digest: sponsorDigest } = sponsorResponse.data;
      console.log("Signing transaction block...");
      const signature = await signTransactionBlock(fromB64(bytes));
      console.log("Executing transaction block...");
      const executeSponsoredTxBody: ExecuteSponsoredTransactionBlockApiInput = {
        signature,
        digest: sponsorDigest,
      };
      const executeResponse: AxiosResponse<{ digest: string }> =
        await axios.post("/api/execute", executeSponsoredTxBody);
      console.log("Executed response: ");
      const digest = executeResponse.data.digest;
      await suiClient.waitForTransactionBlock({ digest, timeout: 5_000 });
      return suiClient.getTransactionBlock({
        digest,
        options,
      });
    } catch (err) {
      console.error("Error in sponsorAndExecuteTransactionBlock:", err);
      if (err instanceof AxiosError) {
        const data = err.response?.data;
        const error = data?.error;
        if (error === "SPONSORSHIP_NOT_ALLOWED") {
          console.log(
            "A mint tx has already been sponsored, user pays the gas"
          );
          return executeTransactionBlockWithoutSponsorship({
            tx,
            options,
          });
        }
      }
    }
  };

  // some transactions cannot be sponsored by Enoki in its current state
  // for example when want to use the gas coin as an argument in a move call
  // so we provide an additional method to execute transactions without sponsorship
  const executeTransactionBlockWithoutSponsorship = async ({
    tx,
    options,
  }: ExecuteTransactionBlockWithoutSponsorshipProps): Promise<SuiTransactionBlockResponse | void> => {
    if (!isWalletKitConnected) {
      toast.error("Wallet is not connected");
      return;
    }
    tx.setSender(currentWalletKitAccount?.address!);
    const txBytes = await tx.build({ client: suiClient });
    const signature = await signTransactionBlock(txBytes);
    return suiClient.executeTransactionBlock({
      transactionBlock: txBytes,
      signature: signature!,
      requestType: "WaitForLocalExecution",
      options,
    });
  };
  return (
    <CustomWalletContext.Provider
      value={{
        isSuiConnected: isWalletKitConnected,
        isSuiConnecting,
        suiAddress: currentWalletKitAccount?.address,
        sponsorAndExecuteTransactionBlock,
        executeTransactionBlockWithoutSponsorship,
        suiLogout: walletKitDisconnect,
        // ownedLinks,
        // areOwnedLinksLoading,
        // fetchOwnedLinks,
      }}
    >
      {children}
    </CustomWalletContext.Provider>
  );
};
