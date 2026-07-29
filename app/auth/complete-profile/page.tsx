import { redirect } from "next/navigation";

import CompleteProfileForm from "./complete-profile-form";
import { isSignupCompletionTokenValid } from "@/lib/auth/signup-completion";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CompleteProfilePageProps = {
  searchParams: Promise<{
    signup_token?: string | string[];
  }>;
};

export default async function CompleteProfilePage({
  searchParams,
}: CompleteProfilePageProps) {
  const params = await searchParams;
  const rawToken = params.signup_token;
  const signupToken =
    typeof rawToken === "string" ? rawToken.trim().toLowerCase() : "";

  if (
    !signupToken ||
    !(await isSignupCompletionTokenValid(signupToken))
  ) {
    redirect("/auth/register?error=invalid_signup_session");
  }

  return <CompleteProfileForm signupToken={signupToken} />;
}
