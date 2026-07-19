export const MONTH_KEYS = [
  "2026-01","2026-02","2026-03","2026-04","2026-05",
  "2026-06","2026-07","2026-08","2026-09","2026-10","2026-11","2026-12",
];

export const MONTH_LABELS = {
  "2026-01": "Jan","2026-02": "Feb","2026-03": "Mar","2026-04": "Apr",
  "2026-05": "May","2026-06": "Jun","2026-07": "Jul","2026-08": "Aug",
  "2026-09": "Sep","2026-10": "Oct","2026-11": "Nov","2026-12": "Dec",
};

// True bulk / continuity-critical categories (as opposed to General Hardware /
// Wood & Timber which are large in item-count but individually low-volume).
export const BULK_CATEGORIES = [
  "Cement", "LPG", "Fuel", "Aggregate", "Sands",
  "Steel Bar & Metals", "Oxygen", "Empty Cylinders",
];

export function currentMonthKey() {
  // The app's data year is fixed to 2026 -- clamp "today" into that range
  // so the default month selector always lands somewhere meaningful.
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const key = `${y}-${m}`;
  if (MONTH_KEYS.includes(key)) return key;
  return MONTH_KEYS[MONTH_KEYS.length - 1];
}
