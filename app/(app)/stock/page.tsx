import { StockTable } from "@/components/inventory/StockTable";

export default function StockPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stock Management</h1>
        <p className="text-muted-foreground mt-1">
          View, add, edit and manage all jewellery items in your inventory.
        </p>
      </div>
      <StockTable />
    </div>
  );
}
