"use client";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import Link from "next/link";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { InfoIcon, Loader2 } from "lucide-react";
import { TermsDialog } from "@/components/auth/terms-dialog";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { register } from "@/lib/api/auth";

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        username: "",
        email: "",
        password: "",
        confirm_password: "",
        secret_code: "",
        agree_terms: false,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const validateForm = (): boolean => {
        // Check all required fields
        if (!formData.first_name || !formData.last_name || !formData.username || 
            !formData.email || !formData.password || !formData.confirm_password) {
            toast.error("Validation Error", {
                description: "Please fill in all required fields",
                duration: 3000,
            });
            return false;
        }

        // Validate first name
        if (formData.first_name.length < 2 || formData.first_name.length > 50) {
            toast.error("Validation Error", {
                description: "First name must be between 2-50 characters",
                duration: 3000,
            });
            return false;
        }

        // Validate last name
        if (formData.last_name.length < 2 || formData.last_name.length > 50) {
            toast.error("Validation Error", {
                description: "Last name must be between 2-50 characters",
                duration: 3000,
            });
            return false;
        }

        // Validate username
        if (formData.username.length < 3 || formData.username.length > 30) {
            toast.error("Validation Error", {
                description: "Username must be between 3-30 characters",
                duration: 3000,
            });
            return false;
        }

        // Check if username is alphanumeric
        if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
            toast.error("Validation Error", {
                description: "Username must contain only letters and numbers",
                duration: 3000,
            });
            return false;
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error("Validation Error", {
                description: "Please enter a valid email address",
                duration: 3000,
            });
            return false;
        }

        // Validate password length
        if (formData.password.length < 8 || formData.password.length > 50) {
            toast.error("Validation Error", {
                description: "Password must be between 8-50 characters",
                duration: 3000,
            });
            return false;
        }

        // Check password complexity (at least one uppercase, one lowercase, one number, one special char)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
        if (!passwordRegex.test(formData.password)) {
            toast.error("Validation Error", {
                description: "Password must contain uppercase, lowercase, number, and special character",
                duration: 4000,
            });
            return false;
        }

        // Check if passwords match
        if (formData.password !== formData.confirm_password) {
            toast.error("Validation Error", {
                description: "Passwords do not match",
                duration: 3000,
            });
            return false;
        }

        // Check if terms are agreed
        if (!formData.agree_terms) {
            toast.error("Validation Error", {
                description: "You must agree to the Terms & Conditions",
                duration: 3000,
            });
            return false;
        }

        return true;
    };

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await register({
                first_name: formData.first_name,
                last_name: formData.last_name,
                username: formData.username,
                email: formData.email,
                password: formData.password,
                secret_code: formData.secret_code,
            });

            if (response.success && response.data) {
                // Success toast
                toast.success("Registration Successful!", {
                    description: "Please check your email to verify your account",
                    duration: 4000,
                });

                // Redirect to check email page
                router.push("/auth/check-email");
            }
        } catch (error: any) {
            console.error("Registration error:", error);
            
            // Show error toast
            toast.error("Registration Failed", {
                description: error.message || "An error occurred. Please try again.",
                duration: 4000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
       <div className="md:flex md:min-h-full bg-background md:p-6 py-6 gap-x-6">
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
          <form onSubmit={handleRegister} className="space-y-4 mb-6">
            {/* First Name input */}
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input 
                id="first_name" 
                placeholder="First Name" 
                type="text"
                value={formData.first_name}
                onChange={handleInputChange}
                disabled={isLoading}
                required={true}
              />
            </div>
            {/* Last Name input */}
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input 
                id="last_name" 
                placeholder="Last Name" 
                type="text"
                value={formData.last_name}
                onChange={handleInputChange}
                disabled={isLoading}
                required={true}
              />
            </div>
            {/* Username input */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="Username" 
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                disabled={isLoading}
                required={true}
              />
            </div>
            {/* Email input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                placeholder="Email" 
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                required={true}
              />
            </div>
            {/* Password input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                placeholder="Password" 
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isLoading}
                required={true}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <Input 
                id="confirm_password" 
                placeholder="Confirm Password" 
                type="password"
                value={formData.confirm_password}
                onChange={handleInputChange}
                disabled={isLoading}
                required={true}
              />
            </div>
            <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="secret_code">Secret Code (Optional)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>If you have a Secret Code From Lihatin, enter it here to unlock special benefits!</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input 
                  id="secret_code" 
                  placeholder="Secret Code" 
                  type="text"
                  value={formData.secret_code}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
            </div>
            {/* Terms and conditions checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="agree_terms"
                checked={formData.agree_terms}
                onCheckedChange={(checked) => 
                  setFormData((prev) => ({ ...prev, agree_terms: checked as boolean }))
                }
                disabled={isLoading}
              />
              <Label htmlFor="agree_terms" className="text-sm font-normal">
                I agree to the{" "}
                <TermsDialog>
                  Terms & Conditions
                </TermsDialog>
              </Label>
            </div>
          </form>
          {/* Sign-up button and Sign-in link */}
          <div className="flex flex-col space-y-4">
            <Button 
              className="w-full"
              onClick={handleRegister}
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign up"
              )}
            </Button>
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
