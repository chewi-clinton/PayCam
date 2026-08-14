"use client";

import { QRCodeSVG } from "qrcode.react";

export function QrDisplay({ value, size = 220 }: { value: string; size?: number }) {
  return (
    <div className="mx-auto w-fit rounded-2xl bg-white p-4">
      <QRCodeSVG value={value} size={size} />
    </div>
  );
}
