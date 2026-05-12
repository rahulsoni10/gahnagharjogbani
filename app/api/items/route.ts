import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const metal = searchParams.get("metal") as "GOLD" | "SILVER" | null;
  const type = searchParams.get("type");
  const search = searchParams.get("search");
  const includeSold = searchParams.get("includeSold") === "true";

  const items = await prisma.item.findMany({
    where: {
      ...(includeSold ? {} : { soldAt: null }),
      ...(metal ? { metal } : {}),
      ...(type ? { type } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { itemCode: { contains: search, mode: "insensitive" } },
              { type: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { dateAdded: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
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

    if (!itemCode || !name || !type || !metal || purityPercent == null || netWeightGrams == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await prisma.item.create({
      data: {
        itemCode: String(itemCode).trim(),
        name: String(name).trim(),
        type: String(type).trim(),
        metal,
        purityPercent: Number(purityPercent),
        grossWeightGrams: grossWeightGrams != null ? Number(grossWeightGrams) : null,
        netWeightGrams: Number(netWeightGrams),
        notes: notes ? String(notes).trim() : null,
        photoUrl: photoUrl ? String(photoUrl).trim() : null,
      },
    });

    return NextResponse.json(item, { status: 201 });
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
