"use client";

/* ---------------------------- React/Next.js Imports --------------------------- */
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

/* ---------------------------- Mysten & dApp Kit Imports -------------------------- */
import { ConnectModal } from "@mysten/dapp-kit";

/* ---------------------------- Hook/Context Imports ---------------------------- */
import { useAuthentication } from "@/contexts/Authentication";
import { useCustomWallet } from "@/contexts/CustomWallet";

/* ---------------------------- Component Imports ------------------------------- */
import { Button } from "@/components/ui/button";
import Link from "next/link";
// import GoogleIcon from "@/components/ui/icons/assets/google.svg";
// import SuiIcon from "@/components/ui/icons/assets/sui.svg";

/* ---------------------------- Page Implementation ------------------------------------------ */
export default function AuthPage() {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const { address } = useCustomWallet();
  const { user, isLoading: isAuthLoading } = useAuthentication();
  const router = useRouter();
  const { redirectToAuthUrl } = useCustomWallet();

  useEffect(() => {
    // Redirect the user to the order page if they are fully logged in
    if (!isAuthLoading && user && address) {
      router.push("/order");
    }
  }, [isAuthLoading, user, address, router]);

  const handleGoogleSignIn = () => {
    // --- TODO: Implement your Google Sign-in logic here ---
    // For now, we'll just simulate a successful login by redirecting.
    // In a real app, you'd trigger the zkLogin flow here.
    console.log("Initiating Google Sign-In...");
    router.push("/order");
  };

  return (
    <>
      {/* Background video for ambiance */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/prelogin.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Adds a dark overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Foreground content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div
          className="flex w-full max-w-md flex-col items-center justify-center gap-6 rounded-2xl
          border border-white/10 bg-black/30 p-8 text-center shadow-2xl backdrop-blur-lg"
        >
          {/* IMPROVEMENT: Added width, height, and a more descriptive alt tag */}
          <Image
            src={"/Walrus_login_bg.png"} // Suggestion: Use a coffee-related logo!
            className="rounded-full border-2 border-white/20"
            width={120}
            height={120}
            alt="Sui Coffee dApp Logo"
          />

          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Sui Coffee
            </h1>
            <p className="max-w-xs text-lg text-slate-300">
              Connect your wallet or Google account to order your next brew
              on-chain.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 pt-4">
            <Button
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition transform hover:scale-105 duration-200"
              onClick={() => {
                // sessionStorage.setItem("userRole", USER_ROLES.ROLE_1);
                setIsConnectModalOpen(true);
              }}
            >
              Connect Wallet
            </Button>

            {/* <Button
              variant="secondary" // Assumes you have a 'secondary' variant in your Button component
              className="h-12 w-full text-lg"
              onClick={handleGoogleSignIn}
            >
              <GoogleIcon className="mr-2 h-5 w-5" />
              Sign in with Google
            </Button> */}

            {/* <Link
              href="#"
              onClick={() => redirectToAuthUrl("order")}
              className="flex items-center justify-center space-x-3 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition transform hover:scale-105 duration-200"
            >
              <Image src="/google.svg" alt="Google" width={24} height={24} />
              <span className="font-medium">Sign In with Google</span>
            </Link> */}
          </div>
        </div>
      </div>

      <ConnectModal
        open={isConnectModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsConnectModalOpen(false);
        }}
        trigger="button"
      />
    </>
  );
}
