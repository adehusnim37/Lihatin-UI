import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import BlobDefault from "@/components/blob/blob-default";

export default function CheckEmailPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-6 overflow-hidden">
      {/* Decorative blobs */}
      <BlobDefault />
      {/* Card container */}
      <Card className="w-full max-w-xl relative z-10 backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center space-y-6">
          <div className="flex justify-center">
            <Image
              src="/logo.svg"
              alt="Lihatin Logo"
              width={100}
              height={100}
              className="h-16 w-16 rounded"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-3">
                <MailIcon className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Check your email</h1>
            <CardDescription className="text-base">
              We&apos;ve sent a verification link to your email address. Please
              check your inbox and click the link to verify your account.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground text-center">
            <p>Didn&apos;t receive the email?</p>
            <Button variant="outline" className="w-full sm:w-auto">
              Resend verification email
            </Button>
          </div>
          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-primary hover:underline"
            >
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
