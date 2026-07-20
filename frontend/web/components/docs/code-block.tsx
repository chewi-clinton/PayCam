"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useDocs } from "@/lib/docs-context";

export function CodeBlock({ python, javascript }: { python: string; javascript: string }) {
  const { language, apiKey } = useDocs();
  const [copied, setCopied] = useState(false);

  const raw = language === "python" ? python : javascript;
  const code = raw.replaceAll("YOUR_API_KEY", apiKey || "YOUR_API_KEY");

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative rounded-lg bg-[#0C0E0D] text-[#F4F6F2]">
      <button
        onClick={copy}
        className="absolute right-2 top-2 rounded-md p-1.5 text-[#B6BEB2] transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
        aria-label="Copy code"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
