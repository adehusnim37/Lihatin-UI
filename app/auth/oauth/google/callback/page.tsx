"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  completeGoogleOAuthCallback,
  saveUserData,
} from "@/lib/api/auth";
import { useAuth } from "@/app/context/AuthContext";

function GoogleOAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) {
      return;
    }
    handledRef.current = true;

    const code = searchParams.get("code")?.trim() || "";
    const state = searchParams.get("state")?.trim() || "";
    const oauthError = searchParams.get("error")?.trim() || "";
    const oauthErrorDescription =
      searchParams.get("error_description")?.trim() || "";

    if (oauthError) {
      const userMessage =
        oauthError === "access_denied"
          ? "Google sign-in was canceled."
          : oauthErrorDescription || "Google sign-in failed.";

      toast.error("Google Sign-in Failed", {
        description: userMessage,
        duration: 4000,
      });
      sessionStorage.removeItem("post_login_redirect");
      router.replace("/auth/login");
      return;
    }

    if (!code || !state) {
      toast.error("Google Sign-in Failed", {
        description: "Missing OAuth callback parameters. Please try again.",
        duration: 4000,
      });
      sessionStorage.removeItem("post_login_redirect");
      router.replace("/auth/login");
      return;
    }

    void (async () => {
      const redirectTo = sessionStorage.getItem("post_login_redirect") || "/main";
      try {
        const response = await completeGoogleOAuthCallback({ code, state });

        if (!response.success || !response.data) {
          throw new Error("Invalid OAuth callback response");
        }

        saveUserData(response.data.user);
        await auth.login(response.data);
        sessionStorage.removeItem("post_login_redirect");

        toast.success("Login Successful", {
          description: `Welcome, ${response.data.user.first_name}!`,
          duration: 2500,
        });
        router.replace(redirectTo);
      } catch (error: unknown) {
        sessionStorage.removeItem("post_login_redirect");
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to complete Google sign-in.";

        toast.error("Google Sign-in Failed", {
          description: errorMessage,
          duration: 4000,
        });
        router.replace("/auth/login");
      }
    })();
  }, [auth, router, searchParams]);

  return (
    <div className="bg-background flex min-h-full flex-col items-center justify-center p-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Completing Google sign-in...
      </div>
    </div>
  );
}

export default function GoogleOAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-full flex-col items-center justify-center p-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <GoogleOAuthCallbackContent />
    </Suspense>
  );
}
