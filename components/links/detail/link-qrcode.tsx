"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LinkQRCodeProps {
  url: string;
  title?: string;
}

export function LinkQRCode({ url, title }: LinkQRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateQR();
  }, [url]);

  const generateQR = async () => {
    try {
      setLoading(true);
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error("Failed to generate QR code", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qrcode-${title || "link"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center p-6 bg-white/5 rounded-lg mx-6 my-2 border border-dashed border-gray-200/20">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="QR Code"
              className="w-full max-w-[200px] h-auto rounded-md shadow-sm bg-white p-2"
            />
          )
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={downloadQR}
          disabled={loading || !qrDataUrl}
        >
          <Download className="mr-2 h-4 w-4" /> Download PNG
        </Button>
      </CardFooter>
    </Card>
  );
}
