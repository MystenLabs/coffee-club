"use client";

import { ChildrenProps } from "@/types/ChildrenProps";
import React from "react";
import { TopNavbar } from "./TopNavbar";
import { FAQs } from "./FAQs";
import { Footer } from "./Footer";
import { AboutBanner } from "./AboutBanner";
import { ErrorBanner } from "../general/ErrorBanner";

export const LargeScreenLayout = ({ children }: ChildrenProps) => {
  return (
    <div className={`relative w-full min-h-screen role-admin flex flex-col`}>
      <TopNavbar />
      <div className="flex flex-1 flex-col p-[12px] gap-y-[12px] items-center justify-center">
        <div
          className="min-h-screen-100 flex flex-col items-center justify-center w-full rounded-[40px] border border-[#ffffff33] p-[16px] py-[80px]"
          style={{
            backgroundImage: "url('/general/background.svg')",
            backgroundSize: "cover",
          }}
        >
          {process.env.NEXT_PUBLIC_IS_APP_ERROR === "true" ? (
            <ErrorBanner />
          ) : (
            children
          )}
        </div>
        <div id="about" className="mt-[-100px] pt-[100px]" />
        <AboutBanner />
        <div id="faq" className="mt-[-100px] pt-[100px]" />
        <FAQs />
        <Footer />
      </div>
    </div>
  );
};
