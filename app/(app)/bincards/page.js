import { getAllItems, getCategories } from "@/lib/data";
import BinCardsClient from "@/components/BinCardsClient";

export const dynamic = "force-dynamic";

export default async function BinCardsPage() {
  const items = await getAllItems();
  const categories = await getCategories();
  return <BinCardsClient items={items} categories={categories} />;
}
