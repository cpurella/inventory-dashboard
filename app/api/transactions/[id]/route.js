import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { ensureSeeded } from "../../../../lib/ensure-seeded";
import { MONTH_KEYS, getCurrentStock } from "../../../../lib/data";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  try {
    await ensureSeeded();
    const id = Number(params.id);
    const body = await request.json();
    const { quantity, date, note } = body;

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }

    const newQty = quantity != null ? Number(quantity) : existing.quantity;
    if (!(newQty > 0)) {
      return NextResponse.json({ error: "Quantity must be greater than 0." }, { status: 400 });
    }
    const newDate = date || existing.date.toISOString().slice(0, 10);
    const newMonth = newDate.slice(0, 7);
    if (!MONTH_KEYS.includes(newMonth)) {
      return NextResponse.json({ error: "Date must fall within 2026." }, { status: 400 });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        quantity: newQty,
        date: new Date(newDate),
        note: note !== undefined ? note : existing.note,
      },
    });

    const currentStock = await getCurrentStock(existing.itemId);
    return NextResponse.json({ ok: true, transaction: updated, currentStock });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not update this entry." }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await ensureSeeded();
    const id = Number(params.id);
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Entry not found." }, { status: 404 });
    }

    await prisma.transaction.delete({ where: { id } });
    const currentStock = await getCurrentStock(existing.itemId);

    return NextResponse.json({ ok: true, currentStock });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not delete this entry." }, { status: 500 });
  }
}
