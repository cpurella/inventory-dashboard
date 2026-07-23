import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCategoryItemsWithLedger } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COLS = 7; // Date, Type, Location, Reference/Customer, In, Out, Balance

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    if (!category) {
      return NextResponse.json({ error: "Category is required." }, { status: 400 });
    }

    const items = await getCategoryItemsWithLedger(category);

    const aoa = [];
    const merges = [];

    aoa.push([`BIN CARDS — ${category.toUpperCase()}`]);
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: COLS - 1 } });
    aoa.push([]);

    for (const it of items) {
      // Item header block (mirrors the original Bin Card layout: code + name + unit on their own lines).
      const headerRow = aoa.length;
      aoa.push([`Item Code: ${it.code}`]);
      merges.push({ s: { r: headerRow, c: 0 }, e: { r: headerRow, c: COLS - 1 } });

      const nameRow = aoa.length;
      aoa.push([`Item Name: ${it.description}   (Unit: ${it.uom})`]);
      merges.push({ s: { r: nameRow, c: 0 }, e: { r: nameRow, c: COLS - 1 } });

      aoa.push(["Date", "Type", "Location", "Reference / Customer", "In", "Out", "Balance"]);

      if (it.ledger.length === 0) {
        const emptyRow = aoa.length;
        aoa.push(["", "", "", "No individual entries recorded for this item", "", "", ""]);
        merges.push({ s: { r: emptyRow, c: 0 }, e: { r: emptyRow, c: COLS - 1 } });
      } else {
        for (const l of it.ledger) {
          const locMatch = l.note ? l.note.match(/^\[(.+?)\]\s*(.*)$/) : null;
          const location = locMatch ? locMatch[1] : "";
          const noteText = locMatch ? locMatch[2] : l.note || "";
          aoa.push([
            l.date,
            l.type,
            location,
            noteText,
            l.type === "GRN" ? l.quantity : "",
            l.type !== "GRN" ? l.quantity : "",
            l.balance,
          ]);
        }
      }

      // Blank separator rows before the next item's block.
      aoa.push([]);
      aoa.push([]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    worksheet["!merges"] = merges;
    worksheet["!cols"] = [
      { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 42 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
    ];
    worksheet["!freeze"] = { xSplit: 0, ySplit: 2 };

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, category.slice(0, 31) || "Bin Cards");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const filename = `bin-cards-${category.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not generate the export." }, { status: 500 });
  }
}
