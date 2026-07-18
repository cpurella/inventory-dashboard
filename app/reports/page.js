import { getAllItems } from "../../lib/data";
import ReportsClient from "../../components/ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const items = await getAllItems();
  return <ReportsClient items={items} />;
}
