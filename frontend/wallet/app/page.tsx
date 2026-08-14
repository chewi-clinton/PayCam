"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Lottie from "lottie-react";
import { getToken } from "@/lib/api-client";
import walletSecure from "@/lib/lottie/wallet_secure.json";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => router.replace(getToken() ? "/home" : "/welcome"), 500);
    return () => clearTimeout(id);
  }, [router]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <Lottie animationData={walletSecure} loop className="w-32" />
      <p className="text-lg font-semibold text-primary">PayCam</p>
    </div>
  );
}
