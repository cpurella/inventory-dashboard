import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import ImportHistoryClient from "@/components/ImportHistoryClient";

export default async function ImportHistoryPage() {
  const user = await getCurrentUser();
  if (!isAdmin(user)) redirect("/settings");
  return <ImportHistoryClient />;
}
