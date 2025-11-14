"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPassword() {
  return (
    <div className="md:flex md:min-h-screen bg-background md:p-6 py-6 gap-x-6">
      {/* Left side: Sign-in form */}
      <div className="md:w-1/2 flex items-center justify-center">
        <div className="max-w-sm px-6 py-16 md:p-0 w-full ">
          {/* Header section with logo and title */}
          <div className="space-y-6 mb-6">
            <Link href="https://www.shadcndesign.com/" target="_blank">
              <Image
                src="/logo.svg"
                alt="Logo"
                width={100}
                height={100}
                className="mx-auto mb-4 rounded"
              />
            </Link>
            {/* Title and description */}
            <div className="flex flex-col gap-y-3">
              <h1 className="text-2xl md:text-3xl font-bold">
                Forgot Password ?
              </h1>
              <p className="text-muted-foreground text-sm">
                Enter your email address below and wel&apos;l send you a link to
                reset your password.
              </p>
            </div>
          </div>
          {/* Sign-in form */}
          <div className="space-y-4 mb-6">
            {/* Email input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="Email" type="email" />
            </div>
          </div>
          {/* Sign-in button and Sign-up link */}
          <div className="flex flex-col space-y-4">
            <Button className="w-full">Send Reset Link</Button>
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link className="underline text-foreground" href="/auth/register">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Right side: Image (hidden on mobile) */}
      <Image
        src="/forgot-password.svg"
        alt="Image"
        width="600"
        height="800"
        className="w-1/2 rounded-xl object-contain md:block hidden"
        style={{ transform: "scale(0.85)" }} // ← Custom scale
      />
    </div>
  );
}
