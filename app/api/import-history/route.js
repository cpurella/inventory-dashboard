import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSeeded } from "@/lib/ensure-seeded";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import historicalTransactions from "@/data/historical-transactions.json";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const requester = await getCurrentUser();
    if (!isAdmin(requester)) {
      return NextResponse.json({ error: "Only an admin can do this." }, { status: 403 });
    }

    await ensureSeeded();
    const body = await request.json().catch(() => ({}));
    if (body.confirm !== "YES") {
      return NextResponse.json({ error: "Confirmation required." }, { status: 400 });
    }

    // Safe to re-run: clears out any previous historical import before
    // reloading, so clicking this twice never creates duplicates. Entries
    // logged manually (source = "manual") are never touched.
    await prisma.transaction.deleteMany({ where: { source: "historical-import" } });

    const rows = historicalTransactions.map((t) => ({
      itemId: t.itemId,
      type: t.type,
      quantity: t.quantity,
      date: new Date(t.date),
      note: t.note ? `${t.note} (from bin card)` : "Imported from bin card",
      source: "historical-import",
    }));

    const CHUNK = 500;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const result = await prisma.transaction.createMany({ data: chunk, skipDuplicates: true });
      inserted += result.count;
    }

    return NextResponse.json({ ok: true, imported: inserted, totalInFile: historicalTransactions.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Import failed." }, { status: 500 });
  }
}

export async function GET() {
  const count = await prisma.transaction.count({ where: { source: "historical-import" } });
  return NextResponse.json({ alreadyImported: count });
}
