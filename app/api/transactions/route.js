import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { ensureSeeded } from "../../../lib/ensure-seeded";
import { MONTH_KEYS } from "../../../lib/constants";
import { bumpMonth, recomputeCascade } from "../../../lib/inventory-engine";

export const dynamic = "force-dynamic";

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

    const tx = await prisma.transaction.create({
      data: { itemId: id, type, quantity: qty, date: new Date(date), note: note || null },
    });

    await bumpMonth(id, monthKey, type, qty);
    const currentStock = await recomputeCascade(id);

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
