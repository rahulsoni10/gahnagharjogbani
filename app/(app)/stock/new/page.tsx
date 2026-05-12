import { ItemForm } from "@/components/inventory/ItemForm";
import { FormPageShell } from "@/components/inventory/FormPageShell";

export default function NewItemPage() {
  return (
    <FormPageShell
      backHref="/stock"
      backLabel="Back to Stock"
      title="Add New Item"
      description="Add a new jewellery item to your inventory."
    >
      <ItemForm mode="create" />
    </FormPageShell>
  );
}
