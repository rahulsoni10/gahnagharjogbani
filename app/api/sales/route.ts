import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sales = await prisma.sale.findMany({
    include: {
      item: {
        select: {
          itemCode: true,
          name: true,
          type: true,
          metal: true,
          purityPercent: true,
          netWeightGrams: true,
          photoUrl: true,
        },
      },
    },
    orderBy: { soldAt: "desc" },
  });
  return NextResponse.json(sales);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, sellingPrice, ratePerGram, makingChargePct, makingChargeAmount, customerName, customerPhone, notes } = body;

    if (!itemId || sellingPrice == null || ratePerGram == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.soldAt) return NextResponse.json({ error: "Item already sold" }, { status: 409 });

    const [sale] = await prisma.$transaction([
      prisma.sale.create({
        data: {
          itemId,
          sellingPrice: Number(sellingPrice),
          ratePerGram: Number(ratePerGram),
          makingChargePct: makingChargePct != null ? Number(makingChargePct) : 0,
          makingChargeAmount: makingChargeAmount != null ? Number(makingChargeAmount) : 0,
          customerName: customerName ? String(customerName).trim() : null,
          customerPhone: customerPhone ? String(customerPhone).trim() : null,
          notes: notes ? String(notes).trim() : null,
        },
      }),
      prisma.item.update({
        where: { id: itemId },
        data: { soldAt: new Date() },
      }),
    ]);

    return NextResponse.json(sale, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
