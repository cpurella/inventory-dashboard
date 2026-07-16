import inventory from "../data/inventory.json";

export const MONTH_KEYS = [
  "2026-01","2026-02","2026-03","2026-04","2026-05",
  "2026-06","2026-07","2026-08","2026-09","2026-10","2026-11","2026-12",
];

export const MONTH_LABELS = {
  "2026-01": "Jan","2026-02": "Feb","2026-03": "Mar","2026-04": "Apr",
  "2026-05": "May","2026-06": "Jun","2026-07": "Jul","2026-08": "Aug",
  "2026-09": "Sep","2026-10": "Oct","2026-11": "Nov","2026-12": "Dec",
};

// The physical stock count ("currentStock") was taken as of this date --
// it's a real snapshot, independent of which movement-month has been filled in.
export const STOCK_AS_OF = "2026-07-07";

// True bulk / continuity-critical categories (as opposed to General Hardware /
// Wood & Timber which are large in item-count but individually low-volume).
export const BULK_CATEGORIES = [
  "Cement", "LPG", "Fuel", "Aggregate", "Sands",
  "Steel Bar & Metals", "Oxygen", "Empty Cylinders",
];

export function getAllItems() {
  return inventory;
}

// IMPORTANT: use the unique internal "id", NOT "code" -- the source sheet
// reuses the same Code across several different item descriptions
// (e.g. timber size variants), so "code" alone is not a safe unique key.
export function getItemById(id) {
  return inventory.find((it) => String(it.id) === String(id));
}

export function getCategories() {
  const set = new Set(inventory.map((it) => it.category || "Uncategorized"));
  return Array.from(set).sort();
}

export function getMonthData(item, monthKey) {
  return item.months.find((m) => m.month === monthKey);
}

// The most recent month that actually has non-zero movement for a
// meaningful slice of items -- used as the table's default month,
// instead of blindly defaulting to December.
export function getLatestActiveMonth() {
  for (let i = MONTH_KEYS.length - 1; i >= 0; i--) {
    const mk = MONTH_KEYS[i];
    const activeCount = inventory.filter((it) => {
      const md = getMonthData(it, mk);
      return md && (md.opening !== 0 || md.added !== 0 || md.usage !== 0 || md.closing !== 0);
    }).length;
    if (activeCount > inventory.length * 0.3) {
      return mk;
    }
  }
  return MONTH_KEYS[0];
}
