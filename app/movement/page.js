import { getAllItems, getCategories, getLatestActiveMonth } from "../../lib/data";
import MovementClient from "../../components/MovementClient";

export default function MovementPage() {
  const items = getAllItems();
  const categories = getCategories();
  const defaultMonth = getLatestActiveMonth();
  return <MovementClient items={items} categories={categories} defaultMonth={defaultMonth} />;
}
