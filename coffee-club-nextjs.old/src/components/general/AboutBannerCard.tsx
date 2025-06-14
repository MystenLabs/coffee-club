import Image from "next/image";
import React from "react";

interface AboutBannerCardProps {
  title: string;
  description: string;
  iconSrc: string;
  iconAlt: string;
}

export const AboutBannerCard = ({
  title,
  description,
  iconSrc,
  iconAlt,
}: AboutBannerCardProps) => {
  return (
    <div className="flex flex-col bg-[#f7f7f80a] py-[40px] px-[32px] gap-y-[24px] rounded-[30px] border-[#ffffff0d] border-[1px] backdrop-blur-[40px] min-w-[300px] max-w-[400px] w-full items-center md:items-start">
      <Image src={iconSrc} width={48} height={48} alt={iconAlt} />
      <div className="flex flex-col gap-y-[12px]">
        <div className="font-TWKEverettMedium text-[#F7F7F8] text-[24px] leading-[32px] text-center md:text-start">
          {title}
        </div>
        <div
          className={`text-[#ABBDCC] font-[400] text-[16px] leading-[24px] text-center md:text-start`}
        >
          {description}
        </div>
      </div>
    </div>
  );
};
