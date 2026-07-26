import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import UploadHistoryClient from "@/components/UploadHistoryClient";

export default async function UploadHistoryPage() {
  const user = await getCurrentUser();
  if (!isAdmin(user)) redirect("/settings");
  return <UploadHistoryClient />;
}
