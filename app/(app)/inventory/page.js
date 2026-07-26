import { getRecentTransactions } from "@/lib/data";
import { getCurrentUser, canEditInventory } from "@/lib/auth";
import InventoryEntryClient from "@/components/InventoryEntryClient";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const user = await getCurrentUser();
  const recent = await getRecentTransactions(30);
  return <InventoryEntryClient initialRecent={recent} canEdit={canEditInventory(user)} />;
}
