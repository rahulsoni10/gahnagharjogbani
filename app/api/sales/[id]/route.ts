import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const sale = await prisma.sale.findUnique({ where: { id } });
    if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

    await prisma.$transaction([
      prisma.sale.delete({ where: { id } }),
      prisma.item.update({
        where: { id: sale.itemId },
        data: { soldAt: null },
      }),
    ]);

    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
