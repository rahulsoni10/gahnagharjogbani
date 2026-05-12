"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Search, ArrowLeft, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LinkButton } from "@/components/ui/link-button";
import { InlineRateCard } from "@/components/inventory/InlineRateCard";
import { calcPureWeight, calcMarketPrice, formatCurrency, goldPurityLabel } from "@/lib/calculations";

interface Item {
  id: string;
  itemCode: string;
  name: string;
  type: string;
  metal: "GOLD" | "SILVER";
  purityPercent: number;
  netWeightGrams: number;
  grossWeightGrams: number | null;
  makingChargePct: number | null;
  notes: string | null;
  photoUrl: string | null;
  soldAt: string | null;
}

function NewSaleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedItemId = searchParams.get("itemId");

  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [liveRate, setLiveRate] = useState<number | null>(null);
  const [sellingPrice, setSellingPrice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/items");
      const data: Item[] = await res.json();
      setItems(data);
      if (preselectedItemId) {
        const found = data.find((i) => i.id === preselectedItemId);
        if (found) setSelectedItem(found);
      }
    } catch {
      toast.error("Failed to load items");
    }
  }, [preselectedItemId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Auto-fill selling price when item or rate changes
  useEffect(() => {
    if (selectedItem && liveRate != null) {
      const price = calcMarketPrice(
        selectedItem.netWeightGrams,
        selectedItem.purityPercent,
        liveRate
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSellingPrice(price.toFixed(0));
    }
  }, [selectedItem, liveRate]);

  const filteredItems = searchQuery.length > 0
    ? items.filter((i) =>
        i.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items.slice(0, 8);

  function selectItem(item: Item) {
    setSelectedItem(item);
    setSearchQuery("");
    setShowDropdown(false);
  }

  const pureWt = selectedItem
    ? calcPureWeight(selectedItem.netWeightGrams, selectedItem.purityPercent)
    : null;

  const marketPrice = selectedItem && liveRate != null
    ? calcMarketPrice(selectedItem.netWeightGrams, selectedItem.purityPercent, liveRate)
    : null;

  const isGold = selectedItem?.metal === "GOLD";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItem) return toast.error("Please select an item");
    if (!sellingPrice || parseFloat(sellingPrice) <= 0) return toast.error("Enter selling price");
    if (liveRate == null) return toast.error("Please set the metal rate");

    setSaving(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedItem.id,
          sellingPrice: parseFloat(sellingPrice),
          ratePerGram: liveRate,
          customerName: customerName.trim() || null,
          customerPhone: customerPhone.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      if (res.ok) {
        toast.success(`Sale recorded for ${selectedItem.name}`);
        router.push("/sales");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Failed to record sale");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <LinkButton variant="ghost" size="sm" href="/sales">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Sales
        </LinkButton>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Record Sale</h1>
        <p className="text-muted-foreground mt-1">Select a stock item and record the sale details.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Item Picker — plain div (not Card) to avoid overflow-hidden clipping the dropdown */}
        <div className="rounded-xl border bg-card text-sm text-card-foreground ring-1 ring-foreground/10">
          <div className="px-6 pt-5 pb-3">
            <h3 className="text-lg font-semibold">Select Item *</h3>
          </div>
          <div className="px-6 pb-6 space-y-4">
            {selectedItem ? (
              <div className={`rounded-lg p-4 border-2 ${isGold ? "border-amber-200 bg-amber-50/40" : "border-slate-200 bg-slate-50/40"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base">{selectedItem.name}</span>
                      <Badge variant="outline" className="font-mono text-xs">{selectedItem.itemCode}</Badge>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{selectedItem.type}</Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${isGold ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-slate-50 text-slate-700 border-slate-200"}`}
                      >
                        {isGold
                          ? `${goldPurityLabel(selectedItem.purityPercent)} Gold`
                          : `${selectedItem.purityPercent}% Silver`}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Net: <strong>{selectedItem.netWeightGrams.toFixed(3)}g</strong>
                      {pureWt != null && (
                        <> · Pure: <strong>{pureWt.toFixed(3)}g</strong></>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedItem(null); setSellingPrice(""); }}
                    className="text-xs text-muted-foreground underline hover:text-foreground"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by item code or name…"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="pl-9 h-10"
                  autoComplete="off"
                />
                {showDropdown && (
                  <div className="absolute z-50 w-full bg-white border border-border rounded-lg shadow-xl mt-1 max-h-64 overflow-y-auto">
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center py-6 gap-2 text-muted-foreground">
                        <Package className="h-6 w-6 opacity-40" />
                        <p className="text-sm font-medium">No stock items found</p>
                        <p className="text-xs text-center px-4">Add items in the Stock tab first.</p>
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="flex flex-col items-center py-6 gap-2 text-muted-foreground">
                        <Package className="h-6 w-6 opacity-40" />
                        <p className="text-sm">No items match &quot;{searchQuery}&quot;</p>
                      </div>
                    ) : (
                      filteredItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectItem(item);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-muted/50 border-b last:border-0 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.itemCode} · {item.type} · {item.netWeightGrams.toFixed(3)}g
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-xs ml-2 ${item.metal === "GOLD" ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600"}`}
                            >
                              {item.metal === "GOLD" ? "Gold" : "Silver"}
                            </Badge>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rate — shown only after item selection */}
        {selectedItem && (
          <InlineRateCard metal={selectedItem.metal} onRateChange={setLiveRate} />
        )}

        {/* Market price preview */}
        {selectedItem && marketPrice != null && (
          <Card className={`border-2 ${isGold ? "border-amber-200 bg-amber-50/40" : "border-slate-200 bg-slate-50/40"}`}>
            <CardContent className="py-3 flex gap-8 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground">Pure Weight</p>
                <p className="text-lg font-bold">{pureWt?.toFixed(3)} g</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Market Price</p>
                <p className={`text-lg font-bold ${isGold ? "text-amber-700" : "text-slate-600"}`}>
                  {formatCurrency(marketPrice)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sale Price */}
        {selectedItem && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Sale Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="sellingPrice" className="text-sm font-semibold">
                  Selling Price (₹) *
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                  <Input
                    id="sellingPrice"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Enter selling price"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="pl-7 h-10 text-base font-semibold"
                  />
                </div>
                {marketPrice != null && sellingPrice && (
                  <p className="text-xs text-muted-foreground">
                    {parseFloat(sellingPrice) > marketPrice
                      ? `+${formatCurrency(parseFloat(sellingPrice) - marketPrice)} above market`
                      : parseFloat(sellingPrice) < marketPrice
                        ? `${formatCurrency(marketPrice - parseFloat(sellingPrice))} below market`
                        : "At market price"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-sm font-semibold">Customer Name</Label>
                <Input
                  id="customerName"
                  placeholder="Optional"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone" className="text-sm font-semibold">Customer Phone</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  placeholder="Optional"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="saleNotes" className="text-sm font-semibold">Notes</Label>
                <Textarea
                  id="saleNotes"
                  placeholder="Optional notes…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="text-base"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={saving || !selectedItem}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {saving ? "Recording…" : "Record Sale"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewSalePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Loading…</div>}>
      <NewSaleForm />
    </Suspense>
  );
}
