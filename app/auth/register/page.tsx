"use client";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import Link from "next/link";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { InfoIcon } from "lucide-react";
import { TermsDialog } from "@/components/auth/terms-dialog";

export default function RegisterPage() {
    return (
       <div className="md:flex md:min-h-screen bg-background md:p-6 py-6 gap-x-6">
      {/* Left side: Sign-up form */}
      <div className="md:w-1/2 flex items-center justify-center">
        <div className="max-w-sm px-6 py-16 md:p-0 w-full">
          {/* Header section with logo and title */}
          <div className="space-y-6 mb-6">
            {/* Logo */}
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
                Create an account
              </h1>
              <p className="text-muted-foreground text-sm">
                Let&apos;s get started. Fill in the details below to create your
                account.
              </p>
            </div>
          </div>
          {/* Sign-up form */}
          <div className="space-y-4 mb-6">
            {/* Name input */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Name" type="text" required={true} />
            </div>
            {/* Email input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="Email" type="email" required={true} />
            </div>
            {/* Password input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" placeholder="Password" type="password" required={true} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" placeholder="Confirm Password" type="password" required={true} />
            </div>
            <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="secret-code">Secret Code (Optional)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>If you have a Secret Code From Lihatin, enter it here to unlock special benefits!</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input id="secret-code" placeholder="Secret Code" type="text" />
            </div>
            {/* Terms and conditions checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms" className="text-sm font-normal">
                I agree to the{" "}
                <TermsDialog>
                  Terms & Conditions
                </TermsDialog>
              </Label>
            </div>
          </div>
          {/* Sign-up button and Sign-in link */}
          <div className="flex flex-col space-y-4">
            <Button className="w-full">Sign up</Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have account?{" "}
              <Link className="underline text-foreground" href="/auth/login">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      {/* Right side: Image (hidden on mobile) */}
      <Image
        src="/sign-up.svg"
        alt="Image"
        width="1000"
        height="1000"
        className="w-1/2 rounded-xl object-cover md:block hidden"
      />
    </div>
    );
}
