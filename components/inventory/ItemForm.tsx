"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  calcPureWeight,
  calcMarketPrice,
  calcStockMetalCost,
  calcMakingCharge,
  calcTotalItemCost,
  toEffectiveRate,
  GOLD_22K_PURITY,
  GOLD_PURITIES,
  GOLD_TYPES,
  SILVER_TYPES,
  getTypesForMetal,
  formatCurrency,
} from "@/lib/calculations";
import { ImageIcon, X } from "lucide-react";
import { InlineRateCard } from "@/components/inventory/InlineRateCard";

interface ItemFormData {
  itemCode: string;
  name: string;
  metal: "GOLD" | "SILVER";
  type: string;
  purityPercent: string;
  grossWeightGrams: string;
  netWeightGrams: string;
  makingChargePct: string;
  makingChargeAmount: string;
  notes: string;
}

interface ItemFormProps {
  initialData?: Partial<ItemFormData> & { id?: string; photoUrl?: string };
  mode: "create" | "edit";
}

const EMPTY_FORM: ItemFormData = {
  itemCode: "",
  name: "",
  metal: "GOLD",
  type: "",
  purityPercent: String(GOLD_22K_PURITY),
  grossWeightGrams: "",
  netWeightGrams: "",
  makingChargePct: "0",
  makingChargeAmount: "0",
  notes: "",
};

export function ItemForm({ initialData, mode }: ItemFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ItemFormData>({ ...EMPTY_FORM, ...initialData });
  const [saving, setSaving] = useState(false);
  const [customType, setCustomType] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>(initialData?.photoUrl ?? "");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [liveRate, setLiveRate] = useState<number | null>(null);

  function set(field: keyof ItemFormData, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "metal") {
        next.purityPercent = value === "GOLD" ? String(GOLD_22K_PURITY) : "";
        next.grossWeightGrams = "";
        next.type = "";
        next.makingChargePct = "0";
        next.makingChargeAmount = "0";
      }
      return next;
    });
    if (field === "metal") setCustomType(false);
  }

  const isGold = form.metal === "GOLD";
  const types = getTypesForMetal(form.metal);
  const allKnownTypes = [...GOLD_TYPES, ...SILVER_TYPES] as readonly string[];
  const netWt = parseFloat(form.netWeightGrams) || 0;
  const purity = parseFloat(form.purityPercent) || 0;
  const pureWt = calcPureWeight(netWt, purity);
  const effectiveRate = liveRate != null ? toEffectiveRate(liveRate, form.metal) : null;
  const marketPrice = effectiveRate != null && netWt > 0 && purity > 0
    ? calcMarketPrice(netWt, purity, effectiveRate)
    : null;
  const stockMetalCost = effectiveRate != null && netWt > 0 && purity > 0
    ? calcStockMetalCost(netWt, purity, effectiveRate)
    : null;
  const mcPct = parseFloat(form.makingChargePct) || 0;
  const mcAmt = parseFloat(form.makingChargeAmount) || 0;
  const stockMakingCharge =
    stockMetalCost != null ? calcMakingCharge(stockMetalCost, mcPct, mcAmt) : null;
  const totalStockCost =
    stockMetalCost != null && effectiveRate != null
      ? calcTotalItemCost(netWt, purity, effectiveRate, mcPct, mcAmt)
      : null;

  async function handlePhotoUpload(file: File) {
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setPhotoUrl(data.url);
        toast.success("Photo uploaded");
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.itemCode.trim()) return toast.error("Item code is required");
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.type.trim()) return toast.error("Item type is required");
    if (!form.purityPercent || parseFloat(form.purityPercent) <= 0)
      return toast.error("Purity is required");
    if (!form.netWeightGrams || parseFloat(form.netWeightGrams) <= 0)
      return toast.error("Net weight is required");
    if (mode === "create" && (liveRate == null || liveRate <= 0))
      return toast.error("Set the metal rate before adding to stock");

    setSaving(true);
    try {
      const body = {
        itemCode: form.itemCode.trim(),
        name: form.name.trim(),
        type: form.type.trim(),
        metal: form.metal,
        purityPercent: parseFloat(form.purityPercent),
        grossWeightGrams: isGold && form.grossWeightGrams ? parseFloat(form.grossWeightGrams) : null,
        netWeightGrams: parseFloat(form.netWeightGrams),
        makingChargePct: mcPct,
        makingChargeAmount: mcAmt,
        ...(mode === "create" && liveRate != null ? { stockRatePerGram: liveRate } : {}),
        notes: form.notes.trim() || null,
        photoUrl: photoUrl.trim() || null,
      };

      const url = mode === "edit" ? `/api/items/${initialData?.id}` : "/api/items";
      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(mode === "edit" ? "Item updated" : "Item added to stock");
        router.push("/stock");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Failed to save item");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="itemCode" className="text-sm font-semibold">Item Code *</Label>
            <Input
              id="itemCode"
              placeholder="e.g. GLD-RING-001"
              value={form.itemCode}
              onChange={(e) => set("itemCode", e.target.value)}
              disabled={mode === "edit"}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold">Item Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Ladies Diamond Ring"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="h-10"
            />
          </div>

          {/* Metal first — type depends on it */}
          <div className="space-y-2">
            <Label htmlFor="metal" className="text-sm font-semibold">Metal *</Label>
            <Select value={form.metal} onValueChange={(v) => v && set("metal", v as "GOLD" | "SILVER")}>
              <SelectTrigger id="metal" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GOLD">Gold</SelectItem>
                <SelectItem value="SILVER">Silver</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type — changes based on metal */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-semibold">
              Item Type *
              <Badge variant="outline" className="ml-2 text-xs font-normal">
                {isGold ? "Gold types" : "Silver types"}
              </Badge>
            </Label>
            {customType ? (
              <div className="flex gap-2">
                <Input
                  id="type"
                  placeholder="Enter custom type"
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                  className="h-10"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setCustomType(false); set("type", ""); }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Select
                value={allKnownTypes.includes(form.type) ? form.type : ""}
                onValueChange={(v) => {
                  if (!v) return;
                  if (v === "__custom__") { setCustomType(true); set("type", ""); }
                  else set("type", v);
                }}
              >
                <SelectTrigger id="type" className="h-10">
                  <SelectValue placeholder="Select item type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">+ Custom type…</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weight & Purity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Weight &amp; Purity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="purity" className="text-sm font-semibold">Purity *</Label>
            {isGold ? (
              <Select value={form.purityPercent} onValueChange={(v) => v && set("purityPercent", v)}>
                <SelectTrigger id="purity" className="h-10">
                  <SelectValue placeholder="Select purity" />
                </SelectTrigger>
                <SelectContent>
                  {GOLD_PURITIES.map((p) => (
                    <SelectItem key={p.value} value={String(p.value)}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="relative">
                <Input
                  id="purity"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g. 92.5"
                  value={form.purityPercent}
                  onChange={(e) => set("purityPercent", e.target.value)}
                  className="pr-8 h-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="netWt" className="text-sm font-semibold">Net Weight (g) *</Label>
            <div className="relative">
              <Input
                id="netWt"
                type="number"
                min="0"
                step="0.001"
                placeholder="e.g. 5.250"
                value={form.netWeightGrams}
                onChange={(e) => set("netWeightGrams", e.target.value)}
                className="pr-6 h-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">g</span>
            </div>
          </div>

          {isGold && (
            <>
              <div className="space-y-2">
                <Label htmlFor="grossWt" className="text-sm font-semibold">Gross Weight (g)</Label>
                <div className="relative">
                  <Input
                    id="grossWt"
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="Optional"
                    value={form.grossWeightGrams}
                    onChange={(e) => set("grossWeightGrams", e.target.value)}
                    className="pr-6 h-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">g</span>
                </div>
              </div>

            </>
          )}
        </CardContent>
      </Card>

      {/* Inline Rate + Live Preview */}
      <InlineRateCard metal={form.metal} onRateChange={setLiveRate} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Wastage & charges (stock)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="stockMakingChargePct" className="text-sm font-semibold">Wastage (%)</Label>
            <div className="relative">
              <Input
                id="stockMakingChargePct"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={form.makingChargePct}
                onChange={(e) => set("makingChargePct", e.target.value)}
                className="pr-8 h-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stockMakingChargeAmount" className="text-sm font-semibold">Making charge (₹)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
              <Input
                id="stockMakingChargeAmount"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.makingChargeAmount}
                onChange={(e) => set("makingChargeAmount", e.target.value)}
                className="pl-7 h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {netWt > 0 && purity > 0 && (
        <Card className={`border-2 ${isGold ? "border-amber-200 bg-amber-50/40" : "border-slate-200 bg-slate-50/40"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Live Calculation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="text-sm text-muted-foreground">Pure {isGold ? "Gold" : "Silver"} weight</p>
              <p className="text-xl font-bold">{pureWt.toFixed(3)} g</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Metal cost (at rate)</p>
              {stockMetalCost != null ? (
                <p className={`text-xl font-bold ${isGold ? "text-amber-700" : "text-slate-600"}`}>
                  {formatCurrency(stockMetalCost)}
                </p>
              ) : (
                <p className="text-base text-muted-foreground mt-1">Set rate above</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Wastage & charges</p>
              {stockMakingCharge != null ? (
                <p className={`text-xl font-bold ${isGold ? "text-amber-700" : "text-slate-600"}`}>
                  {formatCurrency(stockMakingCharge)}
                </p>
              ) : (
                <p className="text-base text-muted-foreground mt-1">Set rate above</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total stock cost</p>
              {totalStockCost != null ? (
                <p className={`text-xl font-bold ${isGold ? "text-amber-800" : "text-slate-700"}`}>
                  {formatCurrency(totalStockCost)}
                </p>
              ) : (
                <p className="text-base text-muted-foreground mt-1">Set rate above</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Metal value (same rate)</p>
              {marketPrice != null ? (
                <p className={`text-xl font-bold ${isGold ? "text-amber-700" : "text-slate-600"}`}>
                  {formatCurrency(marketPrice)}
                </p>
              ) : (
                <p className="text-base text-muted-foreground mt-1">Set rate above</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Photo (optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {photoUrl ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="Item photo"
                className="h-32 w-32 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => setPhotoUrl("")}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/40 transition-colors">
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <ImageIcon className="h-6 w-6" />
                <span className="text-sm">
                  {uploadingPhoto ? "Uploading…" : "Click to upload photo"}
                </span>
                <span className="text-xs">JPEG, PNG, WebP · max 5MB</span>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={uploadingPhoto}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
              />
            </label>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Optional notes about this item…"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={3}
            className="text-base"
          />
        </CardContent>
      </Card>

      <Separator />

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? "Saving…" : mode === "edit" ? "Update Item" : "Add to Stock"}
        </Button>
      </div>
    </form>
  );
}
