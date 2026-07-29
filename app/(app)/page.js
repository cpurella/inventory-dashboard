import { getAllItems, getCategories, getLocationBreakdown, getInventoryAsOfDate } from "@/lib/data";
import { currentMonthKey } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const items = await getAllItems();
  const categories = await getCategories();
  const locationBreakdown = await getLocationBreakdown();
  const asOfDate = await getInventoryAsOfDate();
  const defaultMonth = currentMonthKey();
  return (
    <DashboardClient
      items={items}
      categories={categories}
      defaultMonth={defaultMonth}
      locationBreakdown={locationBreakdown}
      userName={user?.name}
      asOfDate={asOfDate}
    />
  );
}
