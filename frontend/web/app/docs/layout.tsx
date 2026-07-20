import Link from "next/link";
import Image from "next/image";
import { DocsProvider } from "@/lib/docs-context";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DocsProvider>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-6 py-4 backdrop-blur">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/brand/logo-badge-black.png" alt="PayCam" width={28} height={28} className="rounded-md" />
            <span className="text-lg font-semibold">PayCam Docs</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Go to Dashboard →
          </Link>
        </header>
        {children}
      </div>
    </DocsProvider>
  );
}
