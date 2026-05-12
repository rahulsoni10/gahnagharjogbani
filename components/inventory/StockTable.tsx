"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import {
  calcPureWeight,
  calcMarketPrice,
  formatCurrency,
  goldPurityLabel,
  GOLD_TYPES,
  SILVER_TYPES,
} from "@/lib/calculations";

interface Item {
  id: string;
  itemCode: string;
  name: string;
  type: string;
  metal: "GOLD" | "SILVER";
  purityPercent: number;
  grossWeightGrams: number | null;
  netWeightGrams: number;
  notes: string | null;
  dateAdded: string;
  soldAt: string | null;
}

interface Rate {
  metal: "GOLD" | "SILVER";
  pricePerGram: number;
}

type SortKey = "dateAdded" | "name" | "itemCode" | "netWeightGrams";
type SortDir = "asc" | "desc";

const ALL_TYPES = [...GOLD_TYPES, ...SILVER_TYPES].filter(
  (t, i, arr) => arr.indexOf(t) === i
);

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown className="h-3 w-3 opacity-40" />;
  return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
}

export function StockTable() {
  const [items, setItems] = useState<Item[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [metalFilter, setMetalFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("dateAdded");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [itemsRes, ratesRes] = await Promise.all([
        fetch("/api/items"),
        fetch("/api/rates"),
      ]);
      const [itemsData, ratesData] = await Promise.all([itemsRes.json(), ratesRes.json()]);
      setItems(itemsData);
      setRates(ratesData);
    } catch {
      toast.error("Failed to load stock");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  function getRate(metal: "GOLD" | "SILVER") {
    return rates.find((r) => r.metal === metal)?.pricePerGram ?? null;
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const filtered = items
    .filter((item) => {
      if (metalFilter !== "ALL" && item.metal !== metalFilter) return false;
      if (typeFilter !== "ALL" && item.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.itemCode.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const aStr = typeof av === "string" ? av.toLowerCase() : av;
      const bStr = typeof bv === "string" ? bv.toLowerCase() : bv;
      if (aStr < bStr) return sortDir === "asc" ? -1 : 1;
      if (aStr > bStr) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  async function handleDelete(id: string) {
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Item deleted");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      toast.error("Failed to delete item");
    }
    setDeleteId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-base">
        Loading stock…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, or type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Select value={metalFilter} onValueChange={(v) => setMetalFilter(v ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-36 h-10">
            <SelectValue placeholder="Metal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Metals</SelectItem>
            <SelectItem value="GOLD">Gold</SelectItem>
            <SelectItem value="SILVER">Silver</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v ?? "ALL")}>
          <SelectTrigger className="w-full sm:w-40 h-10">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {ALL_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <LinkButton href="/stock/new" className="h-10">
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </LinkButton>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing <strong>{filtered.length}</strong> of <strong>{items.length}</strong> items in stock
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Package className="h-12 w-12 opacity-20" />
          <p className="text-base">
            {items.length === 0 ? "No items in stock yet." : "No items match your filters."}
          </p>
          {items.length === 0 && (
            <LinkButton size="sm" href="/stock/new">
              <Plus className="h-4 w-4 mr-1" />
              Add First Item
            </LinkButton>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>
                  <button onClick={() => handleSort("itemCode")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Code <SortIcon col="itemCode" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => handleSort("name")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Name <SortIcon col="name" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Metal</TableHead>
                <TableHead className="text-right">
                  <button onClick={() => handleSort("netWeightGrams")} className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors">
                    Net Wt <SortIcon col="netWeightGrams" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </TableHead>
                <TableHead className="text-right">Pure Wt</TableHead>
                <TableHead className="text-right">Market Value</TableHead>
                <TableHead>
                  <button onClick={() => handleSort("dateAdded")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Added <SortIcon col="dateAdded" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const rate = getRate(item.metal);
                const pureWt = calcPureWeight(item.netWeightGrams, item.purityPercent);
                const marketPrice = rate != null
                  ? calcMarketPrice(item.netWeightGrams, item.purityPercent, rate)
                  : null;
                const isGold = item.metal === "GOLD";

                return (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm">{item.itemCode}</TableCell>
                    <TableCell className="font-medium text-sm max-w-[160px] truncate">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{item.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${isGold ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-slate-50 text-slate-700 border-slate-200"}`}
                      >
                        {isGold ? `${goldPurityLabel(item.purityPercent)} Gold` : `${item.purityPercent}% Silver`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{item.netWeightGrams.toFixed(3)}g</TableCell>
                    <TableCell className="text-right text-sm">{pureWt.toFixed(3)}g</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {marketPrice != null ? (
                        <span className={isGold ? "text-amber-700" : "text-slate-600"}>
                          {formatCurrency(marketPrice)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(item.dateAdded).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/sales/new?itemId=${item.id}`}
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-amber-50 text-amber-600 hover:text-amber-700 transition-colors"
                          title="Record sale"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={`/stock/${item.id}/edit`}
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the item from inventory. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
