import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { interTight_500 } from "@/styles/interTightFonts";

const FAQsContent = [
  {
    question: "What wallets are supported?",
    answer:
      "SuiLink currently supports a variety of Ethereum and Solana wallets, providing broad compatibility and ease of use.",
  },
  {
    question: "Do I have to pay to create a SuiLink?",
    answer:
      "There is no minting fee to create a SuiLink, but each link will incur a gas fee.",
  },
  {
    question:
      "Can I link the same Sui wallet address to multiple ETH/SOL addresses?",
    answer:
      "Absolutely! You can create multiple links to the same Sui wallet address simply by generating multiple NFT passes for each connection. This provides a centralized point of access for all your blockchain activities.",
  },
  {
    question: "How can I manage multiple linked addresses?",
    answer:
      "SuiLink's interface allows you to easily manage and view all linked addresses in one place. You can add or remove connections as needed, giving you full control over your blockchain presence.",
  },
  {
    question: "Can I unlink my wallets?",
    answer:
      "You can permanently sever the link between your wallets by burning the NFT pass, ensuring autonomy and control over your digital identity.",
  },
  {
    question: "Can I transfer or sell my claimed NFT?",
    answer:
      "No, the NFT pass is soulbound to your Sui wallet address and cannot be transferred or sold. It is a permanent representation of your linked identity within the SuiLink ecosystem.",
  },
  {
    question: "Is my personal information safe with SuiLink?",
    answer:
      "Your privacy is our top priority. SuiLink employs advanced security measures to ensure that your personal information and linked wallets remain protected. We never store your private keys or sensitive data on our servers.",
  },
];

export const FAQs = () => {
  return (
    <div className="flex flex-col space-y-[30px] md:space-y-0 md:flex-row md:justify-between w-full lg:px-[117px] px-[30px] py-[80px]">
      <div className="w-full flex flex-col max-w-[408px] gap-y-[30px]">
        <div
          className={`text-white font-TWKEverettRegular text-[54px] leading-[56px]`}
        >
          FAQ
        </div>
        {/* <Link href="#" className="flex gap-x-[5px] items-center text-[#4DA2FF]">
          <div>Learn more about SuiLink by Sui Foundation</div>
          <Image
            src="/general/arrow-right.svg"
            width={18}
            height={18}
            alt="arrow-right"
          />
        </Link> */}
      </div>
      <Accordion
        type="multiple"
        className="flex flex-col space-y-2 w-[100%] text-white w-full max-w-[700px]"
      >
        {FAQsContent.map(({ question, answer }, index) => (
          <AccordionItem value={question} key={index} className="border-b-[1px] border-[#f7f7f81a]">
            <AccordionTrigger
              className={`${interTight_500} leading-[32px] text-[24px] text-start`}
            >
              {question}
            </AccordionTrigger>
            <AccordionContent
              className={`${interTight_500} text-[#A1AAB2] leading-[24px] text-[16px]`}
            >
              {answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
