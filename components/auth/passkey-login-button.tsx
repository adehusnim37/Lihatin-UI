"use client";
import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { loginWithPasskey, passkeyError } from "@/lib/api/security";
import { requiresTOTP, requiresEmailOTP, saveUserData } from "@/lib/api/auth";
import { useAuth } from "@/app/context/AuthContext";
const subscribe = () => () => {};
export function PasskeyLoginButton({
  disabled,
  onBusyChange,
  destination = "/main",
}: {
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
  destination?: string;
}) {
  const router = useRouter();
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const supported = useSyncExternalStore(
    subscribe,
    () => Boolean(window.isSecureContext && window.PublicKeyCredential),
    () => false,
  );
  const signIn = async () => {
    setBusy(true);
    onBusyChange?.(true);
    try {
      const data = await loginWithPasskey();
      if (requiresTOTP(data)) {
        sessionStorage.setItem("pending_auth_token", data.pending_auth_token);
        sessionStorage.setItem("pending_user", JSON.stringify(data.user));
        router.push("/auth/verify-login");
        return;
      }
      if (requiresEmailOTP(data)) {
        sessionStorage.setItem("pending_email_otp_challenge", data.challenge_token);
        sessionStorage.setItem("pending_email_otp_email", data.email);
        router.push("/auth/verify-email-otp");
        return;
      }
      saveUserData(data.user);
      await auth.login(data);
      router.push(
        destination.startsWith("/") && !destination.startsWith("//") ? destination : "/main",
      );
    } catch (error) {
      toast.error("Could not sign in with passkey", { description: passkeyError(error) });
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  };
  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full"
      disabled={disabled || busy || !supported}
      onClick={() => void signIn()}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
      ) : (
        <Fingerprint className="size-4" />
      )}
      {busy ? "Verifying passkey…" : "Continue with passkey"}
    </Button>
  );
}
