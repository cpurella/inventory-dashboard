import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { MONTH_KEYS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function round2(n) {
  return typeof n === "number" && !Number.isNaN(n) ? Math.round(n * 100) / 100 : 0;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const confirm = formData.get("confirm");
    if (confirm !== "YES") {
      return NextResponse.json({ error: "Confirmation required." }, { status: 400 });
    }

    const file = formData.get("file");
    if (!file || typeof file.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

    const phySheetName = workbook.SheetNames.find((n) =>
      n.toLowerCase().replace(/\s/g, "").includes("phy-inventory") ||
      n.toLowerCase().replace(/\s/g, "").includes("phyinventory")
    );
    const mvmtSheetName = workbook.SheetNames.find((n) =>
      n.toLowerCase().includes("mvmnt") || n.toLowerCase().includes("movement")
    );

    if (!phySheetName || !mvmtSheetName) {
      return NextResponse.json(
        {
          error: `Could not find the expected sheets in this file. Sheets found: ${workbook.SheetNames.join(", ")}. Expected one sheet with "PHY-Inventory-List" and one with "MVMNT" in the name.`,
        },
        { status: 400 }
      );
    }

    const phy = XLSX.utils.sheet_to_json(workbook.Sheets[phySheetName], {
      header: 1,
      raw: true,
      defval: null,
    });
    const mvmt = XLSX.utils.sheet_to_json(workbook.Sheets[mvmtSheetName], {
      header: 1,
      raw: true,
      defval: null,
    });

    const mvmtHeaderCell = String(mvmt[2]?.[1] || "").toLowerCase();
    const phyHeaderCell = String(phy[5]?.[5] || "").toLowerCase();
    if (!mvmtHeaderCell.includes("code")) {
      return NextResponse.json(
        { error: `The movement sheet's layout looks different than expected (header row 3, column B should say "Code"). Found: "${mvmt[2]?.[1] ?? ""}".` },
        { status: 400 }
      );
    }
    if (!phyHeaderCell.includes("description")) {
      return NextResponse.json(
        { error: `The PHY inventory sheet's layout looks different than expected (header row 6, column F should say "Item Description"). Found: "${phy[5]?.[5] ?? ""}".` },
        { status: 400 }
      );
    }

    const parsedItems = [];
    for (let i = 0; i < 5000; i++) {
      const phyRow = phy[6 + i];
      const mvmtRow = mvmt[3 + i];
      if (!mvmtRow || mvmtRow[1] == null || mvmtRow[1] === "") break;

      const code = mvmtRow[1];
      const description = mvmtRow[2];
      const uom = mvmtRow[4];

      const category = (phyRow && phyRow[4]) || "Uncategorized";
      const packingSize = phyRow ? phyRow[6] : null;
      const discontinued = phyRow ? !!phyRow[14] : false;

      const months = [];
      for (let m = 0; m < 12; m++) {
        const col = 5 + 4 * m;
        months.push({
          month: MONTH_KEYS[m],
          opening: round2(mvmtRow[col]),
          added: round2(mvmtRow[col + 1]),
          usage: round2(mvmtRow[col + 2]),
          closing: round2(mvmtRow[col + 3]),
        });
      }

      const avgPerDay = round2(mvmtRow[59]);

      parsedItems.push({
        code: String(code),
        description: description || "Unnamed item",
        category: String(category),
        uom: uom || "NOS",
        packingSize: packingSize != null ? String(packingSize) : null,
        avgPerDay,
        discontinued,
        months,
      });
    }

    if (parsedItems.length === 0) {
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

    const user = await getCurrentUser().catch(() => null);
    await prisma.uploadLog.create({
      data: {
        filename: file.name || "uploaded-file.xlsx",
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
