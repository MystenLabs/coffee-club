import { interTight_400 } from "@/styles/interTightFonts";
import Image from "next/image";

export const ErrorBanner = () => {
  return (
    <div className="flex flex-col space-y-[100px] items-center px-[12px] md:px-0">
      <div className="space-y-[40px]">
        <div className="flex gap-x-[30px] items-center justify-center">
          <Image
            src="/logos/suilink.svg"
            width={110}
            height={68}
            alt="Link"
            className="hidden md:block"
          />
          <Image
            src="/logos/suilink.svg"
            width={80}
            height={50}
            alt="Link"
            className="block md:hidden"
          />
          <div className="text-white font-TWKEverettMedium font-[500] text-[51px] md:text-[65px] leading-[51px] md:leading-[65px]">
            SuiLink
          </div>
        </div>
        <div
          className={`text-white ${interTight_400.className} text-[24px] text-center leading-[24px]`}
        >
          Connect wallets across chains to receive future rewards
        </div>
      </div>
      <div
        className={`text-center text-white ${interTight_400.className} text-[24px] text-center leading-[24px]`}
      >
       {process.env.NEXT_PUBLIC_APP_ERROR_MESSAGE || "SuiLink is being updated. Please come back in a few hours."}
      </div>
    </div>
  );
};
