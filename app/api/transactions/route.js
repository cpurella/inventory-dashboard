import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { ensureSeeded } from "../../../lib/ensure-seeded";
import { MONTH_KEYS } from "../../../lib/constants";

export const dynamic = "force-dynamic";

function round2(n) {
  return Math.round(n * 100) / 100;
}

export async function POST(request) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { itemId, type, quantity, date, note } = body;

    if (!itemId || !type || !quantity || !date) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    if (!["GRN", "USAGE", "DAMAGE"].includes(type)) {
      return NextResponse.json({ error: "Invalid entry type." }, { status: 400 });
    }
    const qty = Number(quantity);
    if (!(qty > 0)) {
      return NextResponse.json({ error: "Quantity must be greater than 0." }, { status: 400 });
    }

    const id = Number(itemId);
    const monthKey = String(date).slice(0, 7);
    if (!MONTH_KEYS.includes(monthKey)) {
      return NextResponse.json({ error: "Date must fall within 2026." }, { status: 400 });
    }

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Item not found." }, { status: 404 });
    }

    // 1. Log the transaction itself (permanent audit trail).
    const tx = await prisma.transaction.create({
      data: { itemId: id, type, quantity: qty, date: new Date(date), note: note || null },
    });

    // 2. Bump the relevant month's Added / Usage / Damage total.
    const field = type === "GRN" ? "added" : type === "USAGE" ? "usage" : "damage";
    await prisma.monthlyMovement.upsert({
      where: { itemId_month: { itemId: id, month: monthKey } },
      update: { [field]: { increment: qty } },
      create: {
        itemId: id,
        month: monthKey,
        opening: 0,
        added: 0,
        usage: 0,
        damage: 0,
        [field]: qty,
        closing: 0,
      },
    });

    // 3. Recompute the Jan->Dec opening/closing chain so every later month
    // reflects this change (handles entries logged for any month, not just "today").
    const months = await prisma.monthlyMovement.findMany({
      where: { itemId: id },
      orderBy: { month: "asc" },
    });
    const byMonth = Object.fromEntries(months.map((m) => [m.month, m]));

    let running = byMonth[MONTH_KEYS[0]]?.opening ?? 0;
    for (const mk of MONTH_KEYS) {
      const row = byMonth[mk];
      if (!row) continue;
      const opening = round2(running);
      const closing = round2(opening + row.added - row.usage - row.damage);
      if (row.opening !== opening || row.closing !== closing) {
        await prisma.monthlyMovement.update({
          where: { id: row.id },
          data: { opening, closing },
        });
      }
      running = closing;
    }

    // 4. Update the item's live stock + reorder estimate.
    const currentStock = round2(running);
    let runoutDays = null;
    let runoutDate = null;
    if (item.avgPerDay > 0) {
      runoutDays = round2(currentStock / item.avgPerDay);
      const d = new Date();
      d.setDate(d.getDate() + Math.max(0, Math.round(runoutDays)));
      runoutDate = d.toISOString().slice(0, 10);
    }

    await prisma.item.update({
      where: { id },
      data: { currentStock, runoutDays, runoutDate },
    });

    return NextResponse.json({ ok: true, transaction: tx, currentStock });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong saving this entry." }, { status: 500 });
  }
}

export async function GET(request) {
  await ensureSeeded();
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");
  const limit = Number(searchParams.get("limit") || 20);

  const where = itemId ? { itemId: Number(itemId) } : {};
  const rows = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { item: { select: { code: true, description: true, uom: true } } },
  });

  return NextResponse.json({
    transactions: rows.map((r) => ({
      id: r.id,
      itemId: r.itemId,
      code: r.item.code,
      description: r.item.description,
      uom: r.item.uom,
      type: r.type,
      quantity: r.quantity,
      date: r.date.toISOString().slice(0, 10),
      note: r.note,
    })),
  });
}
