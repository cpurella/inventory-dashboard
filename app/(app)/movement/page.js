import { getAllItems, getCategories } from "@/lib/data";
import { currentMonthKey } from "@/lib/constants";
import MovementClient from "@/components/MovementClient";

export const dynamic = "force-dynamic";

export default async function MovementPage() {
  const items = await getAllItems();
  const categories = await getCategories();
  const defaultMonth = currentMonthKey();
  return <MovementClient items={items} categories={categories} defaultMonth={defaultMonth} />;
}
