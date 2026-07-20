import { getCategories } from "@/lib/data";
import NewItemClient from "@/components/NewItemClient";

export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  const categories = await getCategories();
  return <NewItemClient categories={categories} />;
}
