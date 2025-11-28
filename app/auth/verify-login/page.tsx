import BlobDefault from "@/components/blob/blob-default";
import { OTPForm } from "@/components/otp-form";

export default function OTPPage() {
  return (
    <div className="bg-background flex min-h-full flex-col items-center justify-center gap-6 p-6 md:p-10">
      <BlobDefault />
      <div className="w-full max-w-sm">
        <OTPForm 
          email="user@example.com"
          onVerify={(otp) => console.log("Verifying OTP:", otp)}
          onResend={() => console.log("Resending OTP")}
        />
      </div>
    </div>
  );
}
