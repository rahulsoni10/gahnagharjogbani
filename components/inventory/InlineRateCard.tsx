"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface InlineRateCardProps {
  metal: "GOLD" | "SILVER";
  onRateChange: (rate: number | null) => void;
}

export function InlineRateCard({ metal, onRateChange }: InlineRateCardProps) {
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  const isGold = metal === "GOLD";
  const label = isGold ? "Gold" : "Silver";

  const fetchRate = useCallback(async () => {
    try {
      const res = await fetch("/api/rates");
      const rates: { metal: string; pricePerGram: number }[] = await res.json();
      const found = rates.find((r) => r.metal === metal);
      const rate = found?.pricePerGram ?? null;
      setCurrentRate(rate);
      onRateChange(rate);
    } catch {
      // silent
    }
  }, [metal, onRateChange]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchRate(); }, [fetchRate]);

  function startEdit() {
    setInputValue(currentRate != null ? String(currentRate) : "");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setInputValue("");
  }

  async function saveRate() {
    const num = parseFloat(inputValue);
    if (isNaN(num) || num <= 0) {
      toast.error("Enter a valid rate");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metal, pricePerGram: num }),
      });
      if (res.ok) {
        setCurrentRate(num);
        onRateChange(num);
        setEditing(false);
        toast.success(`${label} rate updated to ₹${num.toLocaleString("en-IN")}/g for stock and sales`);
      } else {
        toast.error("Failed to update rate");
      }
    } catch {
      toast.error("Failed to update rate");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className={`${isGold ? "border-amber-200 bg-amber-50/30" : "border-slate-200 bg-slate-50/30"}`}>
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold text-muted-foreground">
            {isGold ? "Gold Rate 22K (₹/g)" : "Silver Rate (₹/g)"}:
          </span>

          {editing ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="pl-6 h-8 w-32 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRate();
                    if (e.key === "Escape") cancelEdit();
                  }}
                />
              </div>
              <Button
                type="button"
                size="icon"
                className="h-8 w-8"
                onClick={saveRate}
                disabled={saving}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={cancelEdit}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {currentRate != null ? (
                <span className={`text-base font-bold ${isGold ? "text-amber-700" : "text-slate-700"}`}>
                  ₹{currentRate.toLocaleString("en-IN")}/g
                </span>
              ) : (
                <span className="text-sm text-muted-foreground italic">Not set</span>
              )}
              <button
                type="button"
                onClick={startEdit}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title={`Edit ${label} rate`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Use the pencil to update the current rate for stock and sales.
        </p>
      </CardContent>
    </Card>
  );
}
