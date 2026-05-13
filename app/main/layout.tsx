import { requireAuth } from "@/lib/auth/require-auth";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return <>{children}</>;
}
