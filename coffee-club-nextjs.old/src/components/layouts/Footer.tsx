import Image from "next/image";
import Link from "next/link";
import React from "react";

export const Footer = () => {
  return (
    <div
      className="flex flex-wrap flex-col md:flex-row text-white justify-between items-center w-full py-[100px] gap-y-[30px] gap-x-[30px] px-[20px] md:px-[125px] rounded-t-[40px]"
      style={{
        background:
          "linear-gradient(180deg, #0E183F -14.29%, rgba(0, 23, 49, 0) 46.43%)",
      }}
    >
      <div className="flex gap-x-[38px] items-center">
        <Image src="/logos/suilink.svg" alt="logo" width={100} height={100} />
        <div className="text-[50px] md:text-[65px] font-TWKEverettMedium">SuiLink</div>
      </div>
      <div className="space-y-[32px]">
        <div className="flex gap-x-[12px] justify-center md:justify-end">
          <Link
            href="https://discord.gg/stxDEjDZ"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image src="/logos/discord.svg" alt="X" width={40} height={40} />
          </Link>
          <Link
            href="https://www.youtube.com/@Sui-Network"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image src="/logos/youtube.svg" alt="X" width={40} height={40} />
          </Link>
          <Link
            href="https://x.com/SuiNetwork"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image src="logos/x.svg" alt="X" width={40} height={40} />
          </Link>
          <Link
            href="https://www.linkedin.com/company/sui-foundation/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image src="/logos/linkedin.svg" alt="X" width={40} height={40} />
          </Link>
        </div>
        <div>
          <div className="font-TWKEverettRegular uppercase text-[12px] text-center md:text-end">
            ©2024 Sui foundation. All rights reserved.
          </div>
          <div className="font-TWKEverettRegular uppercase text-[12px] flex gap-x-[20px] items-center justify-center md:justify-end">
            <Link
              href="https://sui.io/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="uppercase"
            >
              Terms of Use
            </Link>
            <Link
              href="https://sui.io/policy"
              target="_blank"
              rel="noopener noreferrer"
              className="uppercase"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
