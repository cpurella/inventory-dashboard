import { getAllItems } from "../../lib/data";
import ReportsClient from "../../components/ReportsClient";

export default function ReportsPage() {
  const items = getAllItems();
  return <ReportsClient items={items} />;
}
