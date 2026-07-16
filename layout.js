import { getAllItems, getCategories, getLatestActiveMonth } from "../lib/data";
import DashboardClient from "../components/DashboardClient";

export default function HomePage() {
  const items = getAllItems();
  const categories = getCategories();
  const defaultMonth = getLatestActiveMonth();
  return <DashboardClient items={items} categories={categories} defaultMonth={defaultMonth} />;
}
