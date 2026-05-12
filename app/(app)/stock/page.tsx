import { StockTable } from "@/components/inventory/StockTable";
import { PageHeader } from "@/components/inventory/PageHeader";

export default function StockPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Management"
        description="View, add, edit and manage all jewellery items in your inventory."
      />
      <StockTable />
    </div>
  );
}
