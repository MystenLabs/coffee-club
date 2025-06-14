import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthentication } from "@/contexts/Authentication";
import { CopyIcon, DotsVerticalIcon } from "@radix-ui/react-icons";
import { formatAddress } from "@mysten/sui/utils";
import toast from "react-hot-toast";
import { useRequestSui } from "@/hooks/useRequestSui";
import { LoadingButton } from "./LoadingButton";
import { formatAmount } from "@/helpers/formatAmount";
import BigNumber from "bignumber.js";
import { useCustomWallet } from "@/contexts/CustomWallet";
import Image from "next/image";

interface UserProfileMenuProps {
  trigger?: React.ReactNode;
}

export const UserProfileMenu = ({ trigger }: UserProfileMenuProps) => {
  const { user, handleLogout } = useAuthentication();
  const { address, logout: walletLogout } = useCustomWallet();
  const { handleRequestSui, isLoading, balance } = useRequestSui();

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address!);
    toast.success("Address copied to clipboard");
  };

  if (!address) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="link" className="p-0 w-[44px] h-[44px] text-contrast">
          {trigger || <DotsVerticalIcon />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="min-w-56 bg-popover p-0 font-neue-montreal">
        {/* <DropdownMenuLabel> */}
        {/*   <div> */}
        {/*     {user.firstName} {user.lastName} */}
        {/*   </div> */}
        {/*   <div className="text-black text-opacity-60 text-xs">{user.email}</div> */}
        {/* </DropdownMenuLabel> */}
        {/* <DropdownMenuSeparator className="m-0" /> */}
        <DropdownMenuGroup>
          <DropdownMenuItem className="flex items-center justify-between w-full group">
            {trigger}
            <div className="flex flex-col items-start justify-center">
              <span className="font-medium text-xl">{user.firstName} {user.lastName}</span>
              <span className="text-foreground/50 font-light text-lg">{formatAddress(address)}</span>
            </div>
            <button onClick={handleCopyAddress}>
              <CopyIcon className="w-4 h-4 scale-50 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100 hover:text-primary" />
            </button>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="m-0" />
          <DropdownMenuItem className="flex items-center justify-start gap-4 w-full text-xl">
            <Image width={20} height={20} src="/sui-logo.svg" alt="sui-logo" className="w-5 -h-5" />
            <div>{formatAmount(BigNumber(balance))} SUI</div>
            <LoadingButton onClick={handleRequestSui} isLoading={isLoading}>
              Request SUI
            </LoadingButton>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="m-0" />
        <DropdownMenuItem
          onClick={() => {
            walletLogout();
            handleLogout();
          }}
          className="flex items-center justify-start gap-4 w-full cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          <div>Log out</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
