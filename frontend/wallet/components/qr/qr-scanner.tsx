"use client";

import { useEffect, useRef, useState } from "react";
import { ImageDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import type QrScannerLib from "qr-scanner";

type Status = "loading" | "active" | "denied" | "unsupported";

export function QrScanner({ onDecode }: { onDecode: (data: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScannerLib | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { default: QrScanner } = await import("qr-scanner");
      if (cancelled || !videoRef.current) return;

      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        setStatus("unsupported");
        return;
      }

      const scanner = new QrScanner(videoRef.current, (result) => onDecode(result.data), {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: "environment",
      });
      scannerRef.current = scanner;

      try {
        await scanner.start();
        if (!cancelled) setStatus("active");
      } catch {
        if (!cancelled) setStatus("denied");
      }
    })();

    return () => {
      cancelled = true;
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [onDecode]);

  const handleFile = async (file: File) => {
    const { default: QrScanner } = await import("qr-scanner");
    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      onDecode(result.data);
    } catch {
      // no code found in the image — let the caller show a toast via onDecode never firing
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {status !== "active" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-6 text-center text-sm text-white">
            {status === "loading" && t("common.loading")}
            {status === "denied" && t("scanner.cameraDenied")}
            {status === "unsupported" && t("scanner.cameraUnsupported")}
          </div>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">{t("scanner.alignQrCode")}</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="mx-auto flex items-center gap-2 text-sm text-primary underline"
      >
        <ImageDown className="h-4 w-4" />
        {t("scanner.gallery")}
      </button>
    </div>
  );
}
