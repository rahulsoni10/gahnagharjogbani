import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcStockMetalCost, normalizePurityPercent } from "@/lib/calculations";

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

  return NextResponse.json(
    items.map((item) => ({
      ...item,
      purityPercent: normalizePurityPercent(item.purityPercent),
    }))
  );
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
      stockRatePerGram,
      notes,
      photoUrl,
    } = body;

    if (!itemCode || !name || !type || !metal || purityPercent == null || netWeightGrams == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const normalizedPurity = normalizePurityPercent(Number(purityPercent));
    const normalizedNetWeight = Number(netWeightGrams);
    let resolvedStockRate = stockRatePerGram != null ? Number(stockRatePerGram) : null;

    if (resolvedStockRate == null || resolvedStockRate <= 0) {
      const rate = await prisma.rate.findUnique({ where: { metal } });
      resolvedStockRate = rate?.pricePerGram ?? null;
    }

    if (resolvedStockRate == null || resolvedStockRate <= 0) {
      return NextResponse.json({ error: "Metal rate is required to record stock cost" }, { status: 400 });
    }

    const stockMetalCost = calcStockMetalCost(normalizedNetWeight, normalizedPurity, resolvedStockRate);

    const item = await prisma.item.create({
      data: {
        itemCode: String(itemCode).trim(),
        name: String(name).trim(),
        type: String(type).trim(),
        metal,
        purityPercent: normalizedPurity,
        grossWeightGrams: grossWeightGrams != null ? Number(grossWeightGrams) : null,
        netWeightGrams: normalizedNetWeight,
        stockRatePerGram: resolvedStockRate,
        stockMetalCost,
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
