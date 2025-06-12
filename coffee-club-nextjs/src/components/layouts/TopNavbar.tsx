import React, { useState } from "react";
import Image from "next/image";
import { useCustomWallet } from "@/contexts/CustomWallet";
import Link from "next/link";
import { ConnectedWalletMenu } from "../general/ConnectedWalletMenu";
import { interTight_500 } from "@/styles/interTightFonts";

export const TopNavbar = () => {
  const { suiAddress, ownedLinks } = useCustomWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const renderBanner = () => {
    return (
      <Link
        href={!!ownedLinks.length ? "/suilinks" : "/"}
        className="flex space-x-[8px] py-[19px]"
      >
        <Image src="/logos/suilink.svg" width={39} height={22} alt="Link" />
        <div className="text-[23px] text-white font-TWKEverettMedium">SuiLink</div>
      </Link>
    );
  };

  const renderLinks = () => {
    const linkClassName =
      `text-[15px] text-center ${interTight_500.className} text-white text-opacity-80 hover:text-opacity-90 w-full border-[#f7f7f81a] border-b-[1px] md:border-none py-[24px] md:py-[0px]`;
    return (
      <div className="flex h-full flex-col md:flex-row items-center justify-between gap-y-[10px] md:justify-start gap-x-[40px] border-[#f7f7f81a] border-t-[1px] pt-[8px] md:pt-0 md:border-none">
        <div className="flex flex-col md:flex-row gap-x-[48px] gap-y-[8px] items-center w-[90%] md:w-full">
          <Link className={linkClassName} href={!!ownedLinks?.length ? "/suilinks" : "/"}>
            Home
          </Link>
          <Link
            className={`${linkClassName} min-w-[100px]`}
            href="#about"
          >
            About
          </Link>
          <Link className={linkClassName} href="#faq">
            FAQ
          </Link>
        </div>
        {!!suiAddress && (
          <div className="w-[80vw] md:w-[245px] pb-[50px] md:pb-[0px]">
            <ConnectedWalletMenu />
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`sticky top-0 w-full ${
        isMenuOpen ? "h-screen" : ""
      } bg-[#090B1A] px-[25px] z-50 border-b border-[1px] border-[#f7f7f81a]`}
    >
      <div className="hidden md:flex gap-x-[4px] justify-between items-center">
        {renderBanner()}
        <div>{renderLinks()}</div>
      </div>
      <div className="flex flex-col md:hidden h-full">
        <div className="flex justify-between items-center gap-x-[4px] md:pb-0">
          {renderBanner()}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Image
              src={
                isMenuOpen
                  ? "/general/close-menu.svg"
                  : "/general/open-menu.svg"
              }
              width={42}
              height={42}
              alt="Menu"
            />
          </button>
        </div>
        {isMenuOpen && renderLinks()}
      </div>
    </div>
  );
};
