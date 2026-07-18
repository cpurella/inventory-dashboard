import { getAllItems, getCategories } from "../lib/data";
import { currentMonthKey } from "../lib/constants";
import DashboardClient from "../components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const items = await getAllItems();
  const categories = await getCategories();
  const defaultMonth = currentMonthKey();
  return <DashboardClient items={items} categories={categories} defaultMonth={defaultMonth} />;
}
