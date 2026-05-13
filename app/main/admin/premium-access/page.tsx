import { redirect } from "next/navigation";

export default function AdminPremiumAccessRedirectPage() {
  redirect("/main/admin/users");
}
