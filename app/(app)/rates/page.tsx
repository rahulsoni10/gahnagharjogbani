"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/inventory/PageHeader";
import { Coins, Clock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GOLD_22K_PURITY } from "@/lib/calculations";

interface Rate {
  id: string;
  metal: "GOLD" | "SILVER";
  pricePerGram: number;
  updatedAt: string;
}

function RateCard({
  metal,
  rate,
  onSave,
}: {
  metal: "GOLD" | "SILVER";
  rate: Rate | null;
  onSave: (metal: "GOLD" | "SILVER", price: number) => Promise<void>;
}) {
  const [value, setValue] = useState(rate?.pricePerGram?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (rate?.pricePerGram != null) setValue(rate.pricePerGram.toString()); }, [rate]);

  async function handleSave() {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    setSaving(true);
    try {
      await onSave(metal, num);
    } finally {
      setSaving(false);
    }
  }

  const isGold = metal === "GOLD";

  return (
    <Card className={`border-2 ${isGold ? "border-amber-200" : "border-slate-200"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${isGold ? "bg-amber-100" : "bg-slate-100"}`}
          >
            <Coins
              className={`h-5 w-5 ${isGold ? "text-amber-600" : "text-slate-600"}`}
              strokeWidth={1.75}
            />
          </div>
          <div>
            <CardTitle className="text-lg">{isGold ? "Gold" : "Silver"} Rate</CardTitle>
            <CardDescription>
              {isGold ? "Price per gram of 24K (pure) gold" : "Price per gram of pure silver"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {rate && (
          <div
            className={`rounded-lg p-3 ${isGold ? "bg-amber-50" : "bg-slate-50"}`}
          >
            <p className="text-sm text-muted-foreground">Current Rate</p>
            <p className={`text-2xl font-bold ${isGold ? "text-amber-700" : "text-slate-700"}`}>
              ₹{rate.pricePerGram.toLocaleString("en-IN")}/g
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              Updated {new Date(rate.updatedAt).toLocaleString("en-IN")}
            </p>
          </div>
        )}

        {!rate && (
          <div className={`rounded-lg p-3 ${isGold ? "bg-amber-50" : "bg-slate-50"}`}>
            <p className="text-sm text-muted-foreground">No rate set yet</p>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <Label htmlFor={`rate-${metal.toLowerCase()}`}>
            New Rate (₹ per gram)
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                ₹
              </span>
              <Input
                id={`rate-${metal.toLowerCase()}`}
                type="number"
                min="0"
                step="0.01"
                placeholder={isGold ? "e.g. 7500" : "e.g. 90"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pl-7"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !value}
              className={`gap-2 ${isGold ? "bg-amber-600 hover:bg-amber-700" : ""}`}
              style={isGold ? {} : { backgroundColor: `oklch(0.439 0 0)` }}
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Update"}
            </Button>
          </div>
        </div>

        {rate && (
          <div className={`rounded-md p-2 text-xs ${isGold ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-700"}`}>
            <strong>Example:</strong> 10g at {isGold ? "91.66% (22K)" : "92.5% purity"} →{" "}
            ₹{(10 * (isGold ? GOLD_22K_PURITY : 92.5) / 100 * rate.pricePerGram).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RatesPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRates = useCallback(async () => {
    try {
      const res = await fetch("/api/rates");
      const data = await res.json();
      setRates(data);
    } catch {
      toast.error("Failed to load rates");
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchRates(); }, [fetchRates]);

  async function handleSave(metal: "GOLD" | "SILVER", pricePerGram: number) {
    const res = await fetch("/api/rates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metal, pricePerGram }),
    });

    if (res.ok) {
      toast.success(`${metal === "GOLD" ? "Gold" : "Silver"} rate updated`);
      await fetchRates();
    } else {
      toast.error("Failed to update rate");
    }
  }

  const goldRate = rates.find((r) => r.metal === "GOLD") ?? null;
  const silverRate = rates.find((r) => r.metal === "SILVER") ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Metal Rates"
        description="Set daily gold and silver prices. These rates apply to stock value and sale pricing."
      />

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {["gold", "silver"].map((m) => (
            <Card key={m} className="animate-pulse">
              <CardContent className="h-48" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <RateCard metal="GOLD" rate={goldRate} onSave={handleSave} />
          <RateCard metal="SILVER" rate={silverRate} onSave={handleSave} />
        </div>
      )}

      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">How rates are used</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>• <strong>Gold:</strong> Market Price = Net Weight × Purity% × Gold Rate per gram</p>
          <p>• <strong>Silver:</strong> Market Price = Net Weight × Purity% × Silver Rate per gram</p>
          <p>• Rates entered here should be the price of <strong>pure metal</strong> (24K gold / 999 silver) per gram.</p>
        </CardContent>
      </Card>
    </div>
  );
}
