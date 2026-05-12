"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { ShoppingBag, Plus, Search, Trash2, ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { calcPureWeight, calcTotalItemCost, formatCurrency, goldPurityLabel } from "@/lib/calculations";

interface SaleItem {
  itemCode: string;
  name: string;
  type: string;
  metal: "GOLD" | "SILVER";
  purityPercent: number;
  netWeightGrams: number;
  photoUrl: string | null;
}

interface Sale {
  id: string;
  itemId: string;
  item: SaleItem;
  sellingPrice: number;
  ratePerGram: number;
  makingChargePct: number | null;
  makingChargeAmount: number | null;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  soldAt: string;
}

type SortKey = "soldAt" | "sellingPrice";
type SortDir = "asc" | "desc";

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
  return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("soldAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchSales = useCallback(async () => {
    try {
      const res = await fetch("/api/sales");
      const data = await res.json();
      setSales(data);
    } catch {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchSales(); }, [fetchSales]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const filtered = sales
    .filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.item.name.toLowerCase().includes(q) ||
        s.item.itemCode.toLowerCase().includes(q) ||
        (s.customerName?.toLowerCase().includes(q) ?? false)
      );
    })
    .sort((a, b) => {
      const av = sortKey === "soldAt" ? new Date(a.soldAt).getTime() : a.sellingPrice;
      const bv = sortKey === "soldAt" ? new Date(b.soldAt).getTime() : b.sellingPrice;
      return sortDir === "asc" ? av - bv : bv - av;
    });

  const totalRevenue = filtered.reduce((sum, s) => sum + s.sellingPrice, 0);
  const totalCost = filtered.reduce((sum, s) => {
    return (
      sum +
      calcTotalItemCost(
        s.item.netWeightGrams,
        s.item.purityPercent,
        s.ratePerGram,
        s.makingChargePct,
        s.makingChargeAmount
      )
    );
  }, 0);
  const totalProfit = totalRevenue - totalCost;

  async function handleDelete(id: string) {
    const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Sale undone — item returned to stock");
      setSales((prev) => prev.filter((s) => s.id !== id));
    } else {
      toast.error("Failed to undo sale");
    }
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground mt-2 text-base sm:text-lg">
            All recorded sales. Undo a sale to return the item to stock.
          </p>
        </div>
        <LinkButton
          href="/sales/new"
          className="w-full sm:w-auto h-11 text-base bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Plus className="h-5 w-5 mr-2" />
          Record Sale
        </LinkButton>
      </div>

      {filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border bg-card px-4 py-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Sales shown</p>
            <p className="text-2xl font-bold mt-1">{filtered.length}</p>
          </div>
          <div className="rounded-xl border bg-card px-4 py-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Total cost</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalCost)}</p>
          </div>
          <div className="rounded-xl border bg-card px-4 py-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Total revenue</p>
            <p className="text-2xl font-bold mt-1 text-emerald-700">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="rounded-xl border bg-card px-4 py-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Total profit</p>
            <p className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? "text-emerald-700" : "text-destructive"}`}>
              {formatCurrency(totalProfit)}
            </p>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by item name, code, or customer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 text-base"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading sales…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <ShoppingBag className="h-12 w-12 opacity-20" />
          <p className="text-base">
            {sales.length === 0 ? "No sales recorded yet." : "No sales match your search."}
          </p>
          {sales.length === 0 && (
            <LinkButton href="/sales/new" className="bg-amber-600 hover:bg-amber-700 text-white">
              <Plus className="h-4 w-4 mr-1" />
              Record First Sale
            </LinkButton>
          )}
        </div>
      ) : (
        <>
          <div className="hidden lg:block border rounded-xl overflow-x-auto shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Item</TableHead>
                  <TableHead>Type / Metal</TableHead>
                  <TableHead className="text-right">Pure Wt</TableHead>
                  <TableHead className="text-right">Rate@Sale</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">
                    <button onClick={() => handleSort("sellingPrice")} className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors">
                      Sold For <SortIcon col="sellingPrice" sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>
                    <button onClick={() => handleSort("soldAt")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                      Date <SortIcon col="soldAt" sortKey={sortKey} sortDir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Undo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sale) => {
                  const pureWt = calcPureWeight(sale.item.netWeightGrams, sale.item.purityPercent);
                  const cost = calcTotalItemCost(
                    sale.item.netWeightGrams,
                    sale.item.purityPercent,
                    sale.ratePerGram,
                    sale.makingChargePct,
                    sale.makingChargeAmount
                  );
                  const profit = sale.sellingPrice - cost;
                  const isGold = sale.item.metal === "GOLD";
                  return (
                    <TableRow key={sale.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div>
                          <p className="font-medium">{sale.item.name}</p>
                          <p className="text-sm text-muted-foreground font-mono">{sale.item.itemCode}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit">{sale.item.type}</Badge>
                          <Badge
                            variant="outline"
                            className={`w-fit ${isGold ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-slate-50 text-slate-700 border-slate-200"}`}
                          >
                            {isGold ? `${goldPurityLabel(sale.item.purityPercent)} Gold` : `${sale.item.purityPercent}% Silver`}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{pureWt.toFixed(3)}g</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        ₹{sale.ratePerGram.toLocaleString("en-IN")}/g
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(cost)}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-700">
                        {formatCurrency(sale.sellingPrice)}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${profit >= 0 ? "text-emerald-700" : "text-destructive"}`}>
                        {formatCurrency(profit)}
                      </TableCell>
                      <TableCell>
                        {sale.customerName ? (
                          <div>
                            <p>{sale.customerName}</p>
                            {sale.customerPhone && (
                              <p className="text-sm text-muted-foreground">{sale.customerPhone}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(sale.soldAt).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(sale.id)}
                          title="Undo sale"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-4 lg:hidden">
            {filtered.map((sale) => {
              const pureWt = calcPureWeight(sale.item.netWeightGrams, sale.item.purityPercent);
              const cost = calcTotalItemCost(
                sale.item.netWeightGrams,
                sale.item.purityPercent,
                sale.ratePerGram,
                sale.makingChargePct,
                sale.makingChargeAmount
              );
              const profit = sale.sellingPrice - cost;
              const isGold = sale.item.metal === "GOLD";

              return (
                <div key={sale.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-lg">{sale.item.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{sale.item.itemCode}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:text-destructive shrink-0"
                      onClick={() => setDeleteId(sale.id)}
                      title="Undo sale"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{sale.item.type}</Badge>
                    <Badge
                      variant="outline"
                      className={isGold ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-slate-50 text-slate-700 border-slate-200"}
                    >
                      {isGold ? `${goldPurityLabel(sale.item.purityPercent)} Gold` : `${sale.item.purityPercent}% Silver`}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm sm:text-base">
                    <div>
                      <p className="text-muted-foreground">Pure weight</p>
                      <p className="font-medium">{pureWt.toFixed(3)} g</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Rate at sale</p>
                      <p className="font-medium">₹{sale.ratePerGram.toLocaleString("en-IN")}/g</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cost</p>
                      <p className="font-medium">{formatCurrency(cost)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sold for</p>
                      <p className="font-semibold text-emerald-700">{formatCurrency(sale.sellingPrice)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Profit</p>
                      <p className={`font-semibold ${profit >= 0 ? "text-emerald-700" : "text-destructive"}`}>
                        {formatCurrency(profit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">{new Date(sale.soldAt).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>

                  {(sale.customerName || sale.customerPhone) && (
                    <div className="rounded-lg bg-muted/40 px-3 py-2">
                      <p className="text-sm text-muted-foreground">Customer</p>
                      <p className="font-medium">{sale.customerName ?? "—"}</p>
                      {sale.customerPhone && <p className="text-sm text-muted-foreground">{sale.customerPhone}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Undo this sale?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the sale record and return the item back to your stock.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Undo Sale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
