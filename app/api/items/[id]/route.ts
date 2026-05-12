import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePurityPercent } from "@/lib/calculations";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.item.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    ...item,
    purityPercent: normalizePurityPercent(item.purityPercent),
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();

    const {
      itemCode,
      name,
      type,
      metal,
      purityPercent,
      grossWeightGrams,
      netWeightGrams,
      notes,
      photoUrl,
    } = body;

    const item = await prisma.item.update({
      where: { id },
      data: {
        ...(itemCode !== undefined && { itemCode: String(itemCode).trim() }),
        ...(name !== undefined && { name: String(name).trim() }),
        ...(type !== undefined && { type: String(type).trim() }),
        ...(metal !== undefined && { metal }),
        ...(purityPercent !== undefined && {
          purityPercent: normalizePurityPercent(Number(purityPercent)),
        }),
        ...(grossWeightGrams !== undefined && {
          grossWeightGrams: grossWeightGrams !== null ? Number(grossWeightGrams) : null,
        }),
        ...(netWeightGrams !== undefined && { netWeightGrams: Number(netWeightGrams) }),
        ...(notes !== undefined && { notes: notes ? String(notes).trim() : null }),
        ...(photoUrl !== undefined && { photoUrl: photoUrl ? String(photoUrl).trim() : null }),
      },
    });

    return NextResponse.json({
      ...item,
      purityPercent: normalizePurityPercent(item.purityPercent),
    });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "Item code already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.item.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
