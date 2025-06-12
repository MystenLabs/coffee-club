import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAccounts,
  useCurrentAccount,
  useDisconnectWallet,
  useSwitchAccount,
} from "@mysten/dapp-kit";
import { formatAddress } from "@mysten/sui/utils";
import Image from "next/image";
import toast from "react-hot-toast";
import { formatString } from "@/helpers/formatString";

export const ConnectedWalletMenu = () => {
  const currentAccount = useCurrentAccount();
  const accounts = useAccounts();
  const { mutate: switchAccount } = useSwitchAccount();
  const { mutate: disconnect } = useDisconnectWallet();

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  };

  if (!currentAccount) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-[80vw] md:w-[230px] py-[8px] px-[12px] h-auto border-none bg-[#f7f7f81a] hover:bg-[#142950] hover:text-white text-[#f7f7f8] flex justify-between items-center gap-x-[16px] focus-visible:ring-offset-0"
        >
          <Image src="/logos/sui.svg" width={24} height={24} alt="Sui" />
          <div className="!text-[15px] font-[500]">
            {currentAccount.label
              ? formatString(currentAccount.label, 10)
              : formatAddress(currentAccount.address)}
          </div>
          <Image src="/wallet/arrow-down.svg" width={16} height={16} alt="Expand" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[80vw] md:w-[245px] bg-[#090B1A] text-white border-[#f7f7f81a] rounded-[16px]">
        <DropdownMenuGroup className="!hover:bg-inherit">
          {accounts.map((account, index) => (
            <DropdownMenuItem
              key={account.address}
              className="flex justify-between items-center focus:bg-[#f7f7f81a] focus:text-white hover:cursor-pointer py-[12px] px-[16px]"
              onSelect={() => {
                if (account.address !== currentAccount.address) {
                  switchAccount({ account });
                }
              }}
            >
              {!!account.label ? (
                <div className="flex flex-col text-[12px]">
                  <div className="font-[600] text-white">{formatString(account.label, 18)}</div>
                  <div className="text-[#A1AAB2]">
                    {formatAddress(account.address)}
                  </div>
                </div>
              ) : (
                <div className="text-[12px] font-[600] text-white">
                  {formatAddress(account.address)}
                </div>
              )}

              <div className="flex items-center gap-x-[12px]">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleCopyAddress(account.address);
                  }}
                >
                  <Image
                    src="/wallet/copy-address.svg"
                    width={16}
                    height={16}
                    alt="Copy"
                  />
                </button>
                {account.address === currentAccount.address && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      disconnect();
                    }}
                  >
                    <Image
                      src="/wallet/disconnect.svg"
                      width={16}
                      height={16}
                      alt="disconnect"
                    />
                  </button>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
