import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCategoryItemsWithLedger } from "@/lib/data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    if (!category) {
      return NextResponse.json({ error: "Category is required." }, { status: 400 });
    }

    const items = await getCategoryItemsWithLedger(category);

    const rows = [];
    for (const it of items) {
      if (it.ledger.length === 0) {
        rows.push({
          "Item Code": it.code,
          "Item Description": it.description,
          "UOM": it.uom,
          "Date": "",
          "Type": "",
          "Location": "",
          "Reference / Customer": "No individual entries recorded",
          "In": "",
          "Out": "",
          "Balance": "",
        });
        continue;
      }
      for (const l of it.ledger) {
        const locMatch = l.note ? l.note.match(/^\[(.+?)\]\s*(.*)$/) : null;
        const location = locMatch ? locMatch[1] : "";
        const noteText = locMatch ? locMatch[2] : l.note || "";
        rows.push({
          "Item Code": it.code,
          "Item Description": it.description,
          "UOM": it.uom,
          "Date": l.date,
          "Type": l.type,
          "Location": location,
          "Reference / Customer": noteText,
          "In": l.type === "GRN" ? l.quantity : "",
          "Out": l.type !== "GRN" ? l.quantity : "",
          "Balance": l.balance,
        });
      }
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 14 }, { wch: 38 }, { wch: 8 }, { wch: 12 }, { wch: 10 },
      { wch: 12 }, { wch: 40 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
    ];
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
