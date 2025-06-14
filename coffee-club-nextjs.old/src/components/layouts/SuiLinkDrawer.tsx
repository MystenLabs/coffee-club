import { useSuiClient } from "@mysten/dapp-kit";
import { SuiLinkObject, SuiLinkObjectOnChain } from "@/types/SuiLinkObject";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import SuiLinkDisplay from "@/app/api/suilinks/[id]/SuiLinkDisplay";
import { formatDateTime } from "@/helpers/formatDateTime";
import Image from "next/image";
import { formatAddress } from "@mysten/sui.js/utils";
import Link from "next/link";
import { getSuiExplorerLink } from "@/helpers/getSuiExplorerLink";
import toast from "react-hot-toast";
import { useDestroySuiLink } from "@/hooks/useDestroySuiLink";
import { Spinner } from "../general/Spinner";
import { useCustomWallet } from "@/contexts/CustomWallet";
import { Drawer } from "../general/Drawer";
import { interTight_400 } from "@/styles/interTightFonts";
import { formatSuiLinkObject } from "@/helpers/formatSuiLinkObject";

export const SuiLinkDrawer = () => {
  const suiClient = useSuiClient();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { fetchOwnedLinks } = useCustomWallet();
  const { handleDestroy, isLoading: isDestroyLoading } = useDestroySuiLink();
  const [suiLinkObject, setSuiLinkObject] = useState<SuiLinkObject | null>(
    null
  );
  const [isDestroyClicked, setIsDestroyClicked] = useState(false);

  useEffect(() => {
    if (!!isDestroyClicked) {
      setTimeout(() => {
        setIsDestroyClicked(false);
      }, 5000)
    }
  }, [isDestroyClicked])

  useEffect(() => {
    if (!searchParams.get("id")) {
      setSuiLinkObject(null);
      return;
    }
    suiClient
      .getObject({
        id: searchParams.get("id")!,
        options: {
          showContent: true,
          showOwner: true,
          showType: true,
        },
      })
      .then((resp) => {
        const { data } = resp;
        setSuiLinkObject(
          formatSuiLinkObject(data as unknown as SuiLinkObjectOnChain)
        );
      });
    return () => setIsDestroyClicked(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("id"), suiClient]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleClose = () => {
    router.push(pathname);
  };

  const handleClickDestroy = () => {
    // this case is not going to happen
    // the destroy button is only being displayed when the suiLinkObject is fetched
    if (!suiLinkObject) {
      toast.error("Something went wrong.");
      return;
    }
    if (isDestroyClicked) {
      handleDestroy({
        id: suiLinkObject.id,
        chain: suiLinkObject.chain,
        onSuccess: () => {
          fetchOwnedLinks();
          handleClose();
        },
      });
    } else {
      setIsDestroyClicked(true);
    }
  };

  return (
    <Drawer isOpen={!!suiLinkObject} handleClose={handleClose}>
      {!!suiLinkObject && (
        <>
          <div className="flex flex-col px-[24px] gap-y-[24px] md:gap-y-[32px]">
            <div className="text-white text-[32px] md:text-[48px] leading-[52px] font-TWKEverettRegular text-center md:text-start">
              Manage Link
            </div>
            <div
              className={`text-[#A1AAB2] ${interTight_400.className} text-[16px] md:text-[18px] text-center md:text-start`}
            >
              Created on {formatDateTime(suiLinkObject.createdAt)}
            </div>
          </div>
          <div className="space-y-[12px] flex flex-col items-center">
            <SuiLinkDisplay {...suiLinkObject} gradientOpacity={0.15} />
            <div className="space-y-[24px] p-[16px] w-full">
              <div className="flex justify-between items-center">
                <div
                  className={`text-[#A1AAB2] text-[18px] ${interTight_400.className}`}
                >
                  Sui
                </div>
                <div className="flex justify-end items-center gap-x-[8px]">
                  <div className={`${interTight_400.className} text-white`}>
                    {formatAddress(suiLinkObject.suiAddress)}
                  </div>
                  <button onClick={() => handleCopy(suiLinkObject.suiAddress)}>
                    <Image
                      src="/general/copy.svg"
                      width={24}
                      height={24}
                      alt="Copy"
                    />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div
                  className={`text-[#A1AAB2] text-[18px] ${interTight_400.className}`}
                >
                  {suiLinkObject.chain
                    .slice(0, 1)
                    .toLocaleUpperCase()
                    .concat(suiLinkObject.chain.slice(1))}
                </div>
                <div className="flex justify-end items-center gap-x-[8px]">
                  <div className={`${interTight_400.className} text-white`}>
                    {formatAddress(suiLinkObject.networkAddress)}
                  </div>
                  <button
                    onClick={() => handleCopy(suiLinkObject.networkAddress)}
                  >
                    <Image
                      src="/general/copy.svg"
                      width={24}
                      height={24}
                      alt="Copy"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex md:flex-col gap-x-[8px] gap-y-[8px] justify-end items-end">
            <Link
              className="w-[50%] md:w-full flex items-center justify-center text-white space-x-[6px] h-[50px] bg-[#F7F7F81A] hover:bg-[#4CA2FF] transition-colors rounded-[36px]"
              href={getSuiExplorerLink({
                type: "object",
                objectId: suiLinkObject.id,
              })}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div>View on SuiVision</div>
              <Image
                src="/general/arrow-up-right.svg"
                width={12}
                height={12}
                alt="Open"
              />
            </Link>
            <Button
              onClick={handleClickDestroy}
              disabled={isDestroyLoading}
              className={`w-[50%] md:w-full flex items-center justify-center text-white !gap-x-[6px] h-[50px] ${
                isDestroyClicked
                  ? "bg-[#E42547] hover:bg-[#E42547]"
                  : "bg-[#F7F7F81A] hover:bg-[#E4254766]"
              } rounded-[36px]`}
            >
              {isDestroyLoading && <Spinner />}

              <div>
                {isDestroyClicked ? (
                  <span>Click again to destroy</span>
                ) : (
                  <>
                    <span className="hidden md:block">
                      {" "}
                      Destroy link
                    </span>
                    <span className="block md:hidden"> Destroy link</span>
                  </>
                )}
              </div>
              {!isDestroyClicked && (
                <Image
                  src="/general/delete.svg"
                  width={24}
                  height={24}
                  alt="Destroy"
                />
              )}
            </Button>
          </div>
        </>
      )}
    </Drawer>
  );
};
