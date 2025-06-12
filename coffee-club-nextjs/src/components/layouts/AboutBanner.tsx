import React from "react";
import { AboutBannerCard } from "../general/AboutBannerCard";

const sections: {
  title: string;
  description: string;
  iconSrc: string;
  iconAlt: string;
}[] = [
  {
    title: "Get discovered",
    description:
      "SuiLink holders can be easily discovered by Sui ecosystem projects for relevant behavior on all connected wallets.",
    iconSrc: "/about/person.svg",
    iconAlt: "person",
  },
  {
    title: "Verify ownership",
    description:
      "Your SuiLink is a soulbound NFT, held in your Sui wallet, that provides authenticated proof of identity.",
    iconSrc: "/about/verify.svg",
    iconAlt: "verify",
  },
  {
    title: "Receive rewards",
    description:
      "Holding a SuiLink pass unlocks opportunities for special cross-chain rewards, priority features, or exclusive events within the Sui network.",
    iconSrc: "/about/gift.svg",
    iconAlt: "gift",
  },
];

export const AboutBanner = () => {
  return (
    <div
      className="flex flex-col items-center gap-y-[80px] py-[80px] px-[24px] lg:py-[120px] lg:px-[50px] w-full rounded-[40px] backdrop-blur-40 border border-[#ffffff33]"
      style={{
        background:
          "linear-gradient(180deg, #001731 0%, rgba(0, 23, 49, 0.00) 100%)",
      }}
    >
      <div className="flex flex-col items-center gap-y-[24px]">
        <div className="text-white font-TWKEverettRegular text-[54px] leading-[54px] text-center w-full">
          About SuiLink
        </div>
        <div className="text-white font-TWKEverettRegular text-[24px] leading-[32px] text-center">
          Securely link your cross-chain identity
        </div>
      </div>
      <div className="flex flex-wrap items-stretch justify-center gap-x-[8px] gap-y-[16px]">
        {sections.map(({ title, description, iconSrc, iconAlt }, index) => (
          <AboutBannerCard
            key={index}
            title={title}
            description={description}
            iconSrc={iconSrc}
            iconAlt={iconAlt}
          />
        ))}
      </div>
    </div>
  );
};
