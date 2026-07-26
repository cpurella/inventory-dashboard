import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The Excel file is now parsed entirely in the browser (see UploadClient.js) --
// this avoids Vercel's request body size limit on large .xlsx files. This
// route only receives the already-extracted item/month data as JSON and
// performs the non-destructive merge into the database.
export async function POST(request) {
  try {
    const requester = await getCurrentUser();
    if (!isAdmin(requester)) {
      return NextResponse.json({ error: "Only an admin can upload inventory files." }, { status: 403 });
    }

    const body = await request.json();
    const { filename, parsedItems } = body;

    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return NextResponse.json({ error: "No item rows were found in the uploaded file." }, { status: 400 });
    }

    // NON-DESTRUCTIVE MERGE. This never touches the Transaction table, so
    // every GRN / Usage / Damage entry logged in the app survives untouched.
    // Existing items (matched by their position in the list) get their
    // master fields and Excel-sourced monthly baseline replaced; anything
    // beyond the current item count is added as new items.
    const existingItems = await prisma.item.findMany({ orderBy: { id: "asc" } });

    let updatedCount = 0;
    let addedCount = 0;

    for (let i = 0; i < parsedItems.length; i++) {
      const src = parsedItems[i];
      const existing = existingItems[i];

      let itemId;
      if (existing) {
        await prisma.item.update({
          where: { id: existing.id },
          data: {
            code: src.code,
            description: src.description,
            category: src.category,
            uom: src.uom,
            packingSize: src.packingSize,
            avgPerDay: src.avgPerDay,
            discontinued: src.discontinued,
          },
        });
        itemId = existing.id;
        updatedCount++;
      } else {
        const created = await prisma.item.create({
          data: {
            code: src.code,
            description: src.description,
            category: src.category,
            uom: src.uom,
            packingSize: src.packingSize,
            avgPerDay: src.avgPerDay,
            discontinued: src.discontinued,
            currentStock: 0,
          },
        });
        itemId = created.id;
        addedCount++;
      }

      for (const m of src.months) {
        await prisma.monthlyMovement.upsert({
          where: { itemId_month: { itemId, month: m.month } },
          update: { opening: m.opening, added: m.added, usage: m.usage, closing: m.closing },
          create: {
            itemId,
            month: m.month,
            opening: m.opening,
            added: m.added,
            usage: m.usage,
            damage: 0,
            closing: m.closing,
          },
        });
      }
    }

    const untouched = Math.max(0, existingItems.length - parsedItems.length);

    const user = requester;
    await prisma.uploadLog.create({
      data: {
        filename: filename || "uploaded-file.xlsx",
        uploadedByName: user?.name || null,
        itemsUpdated: updatedCount,
        itemsAdded: addedCount,
        itemsUntouched: untouched,
      },
    });

    return NextResponse.json({
      ok: true,
      itemsUpdated: updatedCount,
      itemsAdded: addedCount,
      itemsUntouched: untouched,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Upload failed. Please check the file format." },
      { status: 500 }
    );
  }
}
