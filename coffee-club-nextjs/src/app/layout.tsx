import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@mysten/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";
import { Providers } from "./providers"; // We will create this next

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SuiCoffee",
  description: "Decentralized coffee ordering on the Sui blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
