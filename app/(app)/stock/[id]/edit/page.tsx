import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GOLD_22K_PURITY } from "@/lib/calculations";
import { ItemForm } from "@/components/inventory/ItemForm";
import { FormPageShell } from "@/components/inventory/FormPageShell";

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
    purityPercent: String(Math.abs(item.purityPercent - 91.66) < 0.01 ? GOLD_22K_PURITY : item.purityPercent),
    grossWeightGrams: item.grossWeightGrams != null ? String(item.grossWeightGrams) : "",
    netWeightGrams: String(item.netWeightGrams),
    notes: item.notes ?? "",
    photoUrl: item.photoUrl ?? "",
  };

  return (
    <FormPageShell
      backHref="/stock"
      backLabel="Back to Stock"
      title="Edit Item"
      description={`Update details for ${item.name} (${item.itemCode}).`}
    >
      <ItemForm mode="edit" initialData={initialData} />
    </FormPageShell>
  );
}
