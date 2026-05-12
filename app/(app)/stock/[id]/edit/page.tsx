import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ItemForm } from "@/components/inventory/ItemForm";
import { ArrowLeft } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.item.findUnique({ where: { id } });

  if (!item) notFound();

  const initialData = {
    id: item.id,
    itemCode: item.itemCode,
    name: item.name,
    type: item.type,
    metal: item.metal,
    purityPercent: String(item.purityPercent),
    grossWeightGrams: item.grossWeightGrams != null ? String(item.grossWeightGrams) : "",
    netWeightGrams: String(item.netWeightGrams),
    makingChargePct: item.makingChargePct != null ? String(item.makingChargePct) : "",
    notes: item.notes ?? "",
    photoUrl: item.photoUrl ?? "",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <LinkButton variant="ghost" size="sm" href="/stock">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Stock
        </LinkButton>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Item</h1>
        <p className="text-muted-foreground mt-1">
          Update details for <strong>{item.name}</strong> ({item.itemCode})
        </p>
      </div>

      <ItemForm mode="edit" initialData={initialData} />
    </div>
  );
}
