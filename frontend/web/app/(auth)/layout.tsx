import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <Image src="/brand/logo-badge-black.png" alt="PayCam" width={32} height={32} className="rounded-md" />
              <span className="text-xl font-semibold">PayCam</span>
            </div>
            <ThemeToggle />
          </div>
          {children}
        </div>
      </div>
      <div className="relative hidden w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div />
        <div className="space-y-6">
          <Image
            src="/brand/thumbnail.png"
            alt="PayCam"
            width={800}
            height={405}
            className="w-full max-w-md rounded-xl shadow-lg"
          />
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold leading-tight">
              Accept mobile money, cards, and crypto payments across Cameroon.
            </h2>
            <p className="text-primary-foreground/80">
              One dashboard for MTN MoMo, Orange Money, card payments, and testnet crypto —
              with live transaction updates and webhook delivery you can actually trust.
            </p>
          </div>
        </div>
        <p className="text-sm text-primary-foreground/70">
          © {new Date().getFullYear()} PayCam
        </p>
      </div>
    </div>
  );
}
