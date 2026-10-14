"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function LinkQRCode({ url, title }: { url: string; title?: string }) {
  const [result, setResult] = useState({ url: "", data: "", error: false });
  const loading = result.url !== url;
  const error = result.error;
  const qrDataUrl = result.data;
  useEffect(() => {
    let cancelled = false;
    async function generate() {
      try {
        const data = await QRCode.toDataURL(url, {
          width: 600,
          margin: 2,
          color: { dark: "#000000", light: "#ffffff" },
        });
        if (!cancelled) setResult({ url, data, error: false });
      } catch {
        if (!cancelled) setResult({ url, data: "", error: true });
      }
    }
    void generate();
    return () => {
      cancelled = true;
    };
  }, [url]);
  const download = () => {
    if (!qrDataUrl) return;
    const anchor = document.createElement("a");
    anchor.href = qrDataUrl;
    anchor.download = `qrcode-${title || "link"}.png`;
    anchor.click();
  };
  return (
    <div className="space-y-4">
      <div className="flex min-h-52 items-center justify-center py-2">
        {loading ? (
          <Skeleton className="size-52 rounded-lg" aria-label="Generating QR code" />
        ) : error ? (
          <p role="alert" className="text-center text-sm text-muted-foreground">
            Couldn’t generate the QR code. Close this dialog and try again.
          </p>
        ) : (
          <Image
            src={qrDataUrl}
            alt={`QR code for ${title || "short link"}`}
            width={208}
            height={208}
            unoptimized
            className="rounded-lg bg-white"
          />
        )}
      </div>
      <p className="break-all text-center text-xs text-muted-foreground">{url}</p>
      <Button
        variant="outline"
        className="h-10 w-full"
        onClick={download}
        disabled={loading || !qrDataUrl || error}
      >
        <Download className="size-4" />
        Download PNG
      </Button>
    </div>
  );
}
