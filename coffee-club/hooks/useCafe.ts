"use client";

import {
  useCurrentAccount,
  useSignTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { graphql } from "@mysten/sui/graphql/schemas/latest";
import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID, toB64 } from "@mysten/sui/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const getCafeDataQuery = graphql(`
  query getCafeData($address: String!) {
    object(address: $address) {
      asMoveObject {
        contents {
          data
        }
      }
    }
  }
`);

interface CafeDataResponse {
  object: {
    asMoveObject: {
      contents: {
        data: {
          Struct: Array<{
            name: string;
            value: any;
          }>;
        };
      };
    };
  };
}

const toHexString = (byteArray: number[]): string =>
  "0x" + byteArray.map((b) => b.toString(16).padStart(2, "0")).join("");

export function useCafe() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signTransaction } = useSignTransaction();

  const gqlClient = new SuiGraphQLClient({
    url: `https://sui-${
      process.env.NEXT_PUBLIC_SUI_NETWORK_NAME! as "testnet" | "mainnet"
    }.mystenlabs.com/graphql`,
  });

  const CAFE_ADDRESS = process.env.NEXT_PUBLIC_CAFE_ADDRESS!;
  const PACKAGE_ADDRESS = process.env.NEXT_PUBLIC_PACKAGE_ADDRESS!;
  const NETWORK_NAME = process.env.NEXT_PUBLIC_SUI_NETWORK_NAME!;

  const fetchCafeState = useCallback(async () => {
    if (!currentAccount) {
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await gqlClient.query({
        query: getCafeDataQuery,
        variables: { address: CAFE_ADDRESS },
      });

      const contents = (res.data as CafeDataResponse)?.object?.asMoveObject
        ?.contents?.data?.Struct;
      if (!contents) throw new Error("Could not parse Cafe object contents.");

      const isOpenField = contents.find((f) => f.name === "is_open");
      const adminField = contents.find((f) => f.name === "admin");

      setIsOpen(isOpenField?.value?.Boolean || false);

      const adminAddress = adminField?.value?.Address
        ? toHexString(adminField.value.Address)
        : null;

      if (
        adminAddress &&
        currentAccount.address.toLowerCase() === adminAddress.toLowerCase()
      ) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (e) {
      console.error("Failed to fetch cafe state:", e);
      toast.error("Could not fetch cafe state.");
    } finally {
      setIsLoading(false);
    }
  }, [CAFE_ADDRESS, gqlClient, currentAccount]);

  useEffect(() => {
    fetchCafeState();
  }, [currentAccount, fetchCafeState]);

  const toggleCafeState = async () => {
    if (!currentAccount || !isAdmin) {
      toast.error("Not authorized.");
      return;
    }

    const transaction = new Transaction();
    const targetFunction = isOpen ? "close_cafe" : "open_cafe";
    const newStatus = !isOpen ? "Open" : "Closed";

    transaction.moveCall({
      target: `${PACKAGE_ADDRESS}::suihub_cafe::${targetFunction}`,
      arguments: [
        transaction.object(CAFE_ADDRESS),
        transaction.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    try {
      const txBytes = await transaction.build({
        client: suiClient,
        onlyTransactionKind: true,
      });

      const sponsoredRes = await fetch("/api/order/sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          network: NETWORK_NAME,
          sender: currentAccount.address,
          transactionKindBytes: toB64(txBytes),
          allowedMoveCallTargets: [
            `${PACKAGE_ADDRESS}::suihub_cafe::${targetFunction}`,
          ],
          allowedAddresses: [currentAccount.address],
        }),
      });

      if (!sponsoredRes.ok) {
        const errorBody = await sponsoredRes.json();
        throw new Error(errorBody.error || "Sponsorship request failed");
      }
      const { data: sponsored } = await sponsoredRes.json();

      const { signature } = await signTransaction({
        transaction: sponsored.bytes,
      });
      if (!signature) throw new Error("Failed to sign sponsored transaction");

      const executeRes = await fetch(`/api/order/execute/${sponsored.digest}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
      });

      if (!executeRes.ok) {
        const errorBody = await executeRes.json();
        throw new Error(errorBody.error || "Execution request failed");
      }
      const { data: result } = await executeRes.json();

      await toast.promise(
        suiClient.waitForTransaction({
          digest: result.digest,
        }),
        {
          loading: "Updating cafe status...",
          success: () => {
            fetchCafeState(); // Re-fetch state after success
            return `Cafe is now ${newStatus}!`;
          },
          error: "Transaction failed to finalize.",
        }
      );
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    }
  };

  return { isOpen, isLoading, isAdmin, toggleCafeState, fetchCafeState };
}
