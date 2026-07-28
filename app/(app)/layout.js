import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/PageHeader";

export default async function AppLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-app)]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <PageHeader />
        <main className="p-4 md:p-6 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
