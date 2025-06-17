import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@mysten/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";
import { Providers } from "./providers"; // <-- Import your new component

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next.js Community Starter",
  description: "A modern Next.js starter with theme support",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
