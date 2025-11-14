import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthPage() {
    return (
        <div className="max-w-md mx-auto mt-10">
            <Card>
                <CardHeader>
                    <CardTitle>Authentication</CardTitle>
                    <CardDescription>
                        Choose an authentication option below
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button asChild className="w-full">
                        <Link href="/auth/login">Login</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/auth/register">Register</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/auth/forgot-password">Forgot Password</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/auth/verify-email">OTP Verification</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}