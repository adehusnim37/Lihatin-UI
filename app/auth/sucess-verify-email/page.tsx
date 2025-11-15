import BlobDefault from "@/components/blob/blob-default";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function SuccessVerifyEmailPage() {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center bg-background px-6 py-12 overflow-hidden">
      {/* Decorative Blobs */}
      <BlobDefault />

      <Card className="w-full max-w-xl relative z-10 backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-2 text-center">
          {/* Illustration */}
          <div className="relative w-full max-w-md mx-auto h-64">
            <Image
              src="/Completed-bro.svg"
              alt="Success"
              fill
              className="object-contain"
            />
          </div>

          {/* Heading with gradient */}
          <CardTitle className="text-4xl font-bold">
            <h1 className="text-2xl font-bold">
              Email Verified Successfully!
            </h1>
          </CardTitle>
          <CardDescription className="text-base mb-4">
            Welcome aboard! Your email has been successfully verified. You can
            now log in to your account and start exploring our services.
          </CardDescription>

          {/* Login Button */}
          <Link href="/auth/login" className="inline-block">
            <Button size="lg" className="min-w-[200px]">
              Go to Login
            </Button>
          </Link>
        </CardHeader>
      </Card>
    </div>
  );
}
