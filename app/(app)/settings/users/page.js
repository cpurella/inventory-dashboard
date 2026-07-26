import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import UsersManagementClient from "@/components/UsersManagementClient";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!isAdmin(user)) redirect("/settings");
  return <UsersManagementClient currentUserId={user.id} />;
}
