"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";

export default function Login() {
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
              <h1 className="text-2xl md:text-3xl font-bold">Sign in</h1>
              <p className="text-muted-foreground text-sm">
                Log in to unlock tailored content and stay connected with your
                Short URL &#39;s performance.
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
            {/* Password input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" placeholder="Password" type="password" />
            </div>
            {/* Remember me checkbox and Forgot password link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="keep-signed-in" />
                <Label htmlFor="keep-signed-in" className="text-sm font-medium">
                  Keep me signed in
                </Label>
              </div>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>
          {/* Sign-in button and Sign-up link */}
          <div className="flex flex-col space-y-4">
            <Button className="w-full">Sign in</Button>
            <p className="text-sm text-center text-muted-foreground">
              Don`&apos;`t have an account?{" "}
              <Link className="underline text-foreground" href="/auth/register">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Right side: Image (hidden on mobile) */}
      <Image
        src="/sign-in.svg"
        alt="Image"
        width="600"
        height="800"
        className="w-1/2 rounded-xl object-contain md:block hidden"
        style={{ transform: "scale(0.70)" }} // ← Custom scale
      />
    </div>
  );
}
