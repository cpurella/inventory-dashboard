import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import AdminSeedClient from "@/components/AdminSeedClient";

export default async function AdminSeedPage() {
  const user = await getCurrentUser();
  if (!isAdmin(user)) redirect("/settings");
  return <AdminSeedClient />;
}
