import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Client resizes to a small square before sending, but cap here too so no
// oversized payload ever gets stored in the database.
const MAX_LENGTH = 300_000;

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const { avatarDataUrl } = await request.json();
    if (!avatarDataUrl || typeof avatarDataUrl !== "string" || !avatarDataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image." }, { status: 400 });
    }
    if (avatarDataUrl.length > MAX_LENGTH) {
      return NextResponse.json({ error: "Image is too large." }, { status: 400 });
    }

    await prisma.user.update({ where: { id: user.id }, data: { avatarDataUrl } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not save profile picture." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }
    await prisma.user.update({ where: { id: user.id }, data: { avatarDataUrl: null } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not remove profile picture." }, { status: 500 });
  }
}
