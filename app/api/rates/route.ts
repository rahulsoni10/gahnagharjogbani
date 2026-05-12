import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rates = await prisma.rate.findMany();
  return NextResponse.json(rates);
}

export async function PUT(request: NextRequest) {
  try {
    const { metal, pricePerGram } = await request.json();

    if (!metal || pricePerGram == null || isNaN(Number(pricePerGram))) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const rate = await prisma.rate.upsert({
      where: { metal },
      update: { pricePerGram: Number(pricePerGram) },
      create: { metal, pricePerGram: Number(pricePerGram) },
    });

    return NextResponse.json(rate);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
