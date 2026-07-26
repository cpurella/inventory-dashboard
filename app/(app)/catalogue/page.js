import { Suspense } from "react";
import { getAllItems, getCategories } from "@/lib/data";
import { currentMonthKey } from "@/lib/constants";
import CatalogueClient from "@/components/CatalogueClient";

export const dynamic = "force-dynamic";

export default async function CataloguePage() {
  const items = await getAllItems();
  const categories = await getCategories();
  const defaultMonth = currentMonthKey();
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading...</div>}>
      <CatalogueClient items={items} categories={categories} defaultMonth={defaultMonth} />
    </Suspense>
  );
}
