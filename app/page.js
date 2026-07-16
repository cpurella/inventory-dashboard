import { getAllItems } from "../lib/data";
import DashboardClient from "../components/DashboardClient";

export default function HomePage() {
  const items = getAllItems();
  return <DashboardClient items={items} />;
}
