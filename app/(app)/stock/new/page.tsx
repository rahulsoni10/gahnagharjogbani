import { ItemForm } from "@/components/inventory/ItemForm";
import { ArrowLeft } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";

export default function NewItemPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <LinkButton variant="ghost" size="sm" href="/stock">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Stock
        </LinkButton>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add New Item</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add a new jewellery item to your inventory.
        </p>
      </div>

      <ItemForm mode="create" />
    </div>
  );
}
