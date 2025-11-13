import React from "react"

import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,
} from "@/components/ui/input-otp"

export default function VerifyLogin() {
    return (
        <InputOTP maxLength={8}>
            <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
                <InputOTPSlot index={6} />
                <InputOTPSlot index={7} />
            </InputOTPGroup>
            <div>
                <p className="mt-4 text-sm text-center text-muted-foreground">
                    Enter the 8-digit code sent to your email to verify your login.
                </p>
            </div>
        </InputOTP>
    )
}
