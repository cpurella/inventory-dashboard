import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MONTH_KEYS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const { code, description, category, uom, packingSize, openingStock, avgPerDay } = body;

    if (!code || !description || !category || !uom) {
      return NextResponse.json(
        { error: "Code, description, category, and unit are all required." },
        { status: 400 }
      );
    }

    const opening = Number(openingStock) || 0;
    const avg = Number(avgPerDay) || 0;

    const item = await prisma.item.create({
      data: {
        code: String(code),
        description: String(description),
        category: String(category),
        uom: String(uom),
        packingSize: packingSize ? String(packingSize) : null,
        avgPerDay: avg,
        currentStock: opening,
      },
    });

    // Seed all 12 months so this item behaves exactly like the rest of the
    // catalogue: Jan opening = the given starting stock, everything else 0
    // until GRN/Usage/Damage entries or a future file upload add to it.
    await prisma.monthlyMovement.createMany({
      data: MONTH_KEYS.map((month, i) => ({
        itemId: item.id,
        month,
        opening: i === 0 ? opening : 0,
        added: 0,
        usage: 0,
        damage: 0,
        closing: i === 0 ? opening : 0,
      })),
    });

    return NextResponse.json({ ok: true, itemId: item.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not create this item." }, { status: 500 });
  }
}
