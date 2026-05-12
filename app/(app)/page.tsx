import { prisma } from "@/lib/prisma";
import { calcPureWeight, calcMarketPrice, formatCurrency } from "@/lib/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Gem, Weight, ShoppingBag, IndianRupee } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";

async function getDashboardData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [items, rates, sales, monthlySales] = await Promise.all([
    prisma.item.findMany({ where: { soldAt: null } }),
    prisma.rate.findMany(),
    prisma.sale.findMany({
      include: {
        item: { select: { name: true, type: true, metal: true, purityPercent: true, netWeightGrams: true, itemCode: true } },
      },
      orderBy: { soldAt: "desc" },
      take: 5,
    }),
    prisma.sale.findMany({
      where: { soldAt: { gte: startOfMonth } },
      select: { sellingPrice: true },
    }),
  ]);

  const goldRate = rates.find((r) => r.metal === "GOLD");
  const silverRate = rates.find((r) => r.metal === "SILVER");

  let totalGoldPureWeight = 0;
  let totalSilverPureWeight = 0;
  let totalMarketValue = 0;
  let goldCount = 0;
  let silverCount = 0;

  for (const item of items) {
    const pureWt = calcPureWeight(item.netWeightGrams, item.purityPercent);
    if (item.metal === "GOLD") {
      totalGoldPureWeight += pureWt;
      goldCount++;
      if (goldRate) totalMarketValue += calcMarketPrice(item.netWeightGrams, item.purityPercent, goldRate.pricePerGram);
    } else {
      totalSilverPureWeight += pureWt;
      silverCount++;
      if (silverRate) totalMarketValue += calcMarketPrice(item.netWeightGrams, item.purityPercent, silverRate.pricePerGram);
    }
  }

  const monthlyRevenue = monthlySales.reduce((sum, s) => sum + s.sellingPrice, 0);

  return {
    totalItems: items.length,
    goldCount,
    silverCount,
    totalGoldPureWeight,
    totalSilverPureWeight,
    totalMarketValue: goldRate || silverRate ? totalMarketValue : null,
    goldRate: goldRate?.pricePerGram ?? null,
    silverRate: silverRate?.pricePerGram ?? null,
    goldRateUpdated: goldRate?.updatedAt ?? null,
    silverRateUpdated: silverRate?.updatedAt ?? null,
    recentSales: sales,
    monthlyRevenue,
    monthlySalesCount: monthlySales.length,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const statCards = [
    {
      title: "Items in Stock",
      value: String(data.totalItems),
      sub: `${data.goldCount} gold · ${data.silverCount} silver`,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Pure Gold in Stock",
      value: `${data.totalGoldPureWeight.toFixed(3)} g`,
      sub: data.goldRate ? `Rate: ₹${data.goldRate.toLocaleString("en-IN")}/g` : "Set rate on Rates page",
      icon: Gem,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Pure Silver in Stock",
      value: `${data.totalSilverPureWeight.toFixed(3)} g`,
      sub: data.silverRate ? `Rate: ₹${data.silverRate.toLocaleString("en-IN")}/g` : "Set rate on Rates page",
      icon: Weight,
      color: "text-slate-600",
      bg: "bg-slate-100",
    },
    {
      title: "Stock Market Value",
      value: data.totalMarketValue != null ? formatCurrency(data.totalMarketValue) : "—",
      sub: data.totalMarketValue != null ? "Based on current rates" : "Set rates to see value",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Sales This Month",
      value: String(data.monthlySalesCount),
      sub: data.monthlySalesCount > 0 ? `Revenue: ${formatCurrency(data.monthlyRevenue)}` : "No sales this month",
      icon: ShoppingBag,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(data.monthlyRevenue),
      sub: "This calendar month",
      icon: IndianRupee,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your GehnaGhar inventory.</p>
        </div>
        <LinkButton href="/stock/new">+ Add Item</LinkButton>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ title, value, sub, icon: Icon, color, bg }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              <div className={`p-2 rounded-full ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Rates row */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { metal: "Gold", rate: data.goldRate, updated: data.goldRateUpdated },
          { metal: "Silver", rate: data.silverRate, updated: data.silverRateUpdated },
        ].map(({ metal, rate, updated }) => (
          <Card key={metal}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{metal} Rate (per gram)</p>
                {rate != null ? (
                  <>
                    <p className="text-xl font-bold">₹{rate.toLocaleString("en-IN")}</p>
                    {updated && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Updated {new Date(updated).toLocaleString("en-IN")}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Not set</p>
                )}
              </div>
              <LinkButton variant="outline" size="sm" href="/rates">Update Rate</LinkButton>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Sales */}
      {data.recentSales.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Sales</CardTitle>
              <LinkButton variant="ghost" size="sm" href="/sales">View All</LinkButton>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{sale.item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {sale.item.itemCode} · {sale.item.type} · {new Date(sale.soldAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="text-sm font-bold text-emerald-700">{formatCurrency(sale.sellingPrice)}</p>
                      <p className="text-xs text-muted-foreground">₹{sale.ratePerGram.toLocaleString("en-IN")}/g</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        sale.item.metal === "GOLD"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }
                    >
                      {sale.item.metal === "GOLD" ? "Gold" : "Silver"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.totalItems === 0 && data.recentSales.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4 text-muted-foreground">
            <Gem className="h-12 w-12 opacity-20" />
            <div className="text-center">
              <p className="font-medium text-base">No items in inventory yet</p>
              <p className="text-sm mt-1">Start by adding your first jewellery item.</p>
            </div>
            <LinkButton href="/stock/new">+ Add First Item</LinkButton>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
