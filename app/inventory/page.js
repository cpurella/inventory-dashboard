import { getRecentTransactions } from "../../lib/data";
import InventoryEntryClient from "../../components/InventoryEntryClient";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const recent = await getRecentTransactions(30);
  return <InventoryEntryClient initialRecent={recent} />;
}
