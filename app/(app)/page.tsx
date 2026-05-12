import { prisma } from "@/lib/prisma";
import { calcPureWeight, calcMarketPrice, formatCurrency } from "@/lib/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/inventory/PageHeader";
import { Boxes, TrendingUp, Gem, Scale, Receipt, IndianRupee, Plus } from "lucide-react";
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
      icon: Boxes,
      accent: "border-l-blue-500",
      iconWrap: "bg-blue-100 text-blue-700",
    },
    {
      title: "Pure Gold in Stock",
      value: `${data.totalGoldPureWeight.toFixed(3)} g`,
      sub: data.goldRate ? `Rate: ₹${data.goldRate.toLocaleString("en-IN")}/g` : "Set rate on Rates page",
      icon: Gem,
      accent: "border-l-amber-500",
      iconWrap: "bg-amber-100 text-amber-700",
    },
    {
      title: "Pure Silver in Stock",
      value: `${data.totalSilverPureWeight.toFixed(3)} g`,
      sub: data.silverRate ? `Rate: ₹${data.silverRate.toLocaleString("en-IN")}/g` : "Set rate on Rates page",
      icon: Scale,
      accent: "border-l-slate-500",
      iconWrap: "bg-slate-200 text-slate-700",
    },
    {
      title: "Total Pure Metal Cost",
      value: data.totalMarketValue != null ? formatCurrency(data.totalMarketValue) : "—",
      sub: data.totalMarketValue != null ? "Based on current rates" : "Set rates to see value",
      icon: TrendingUp,
      accent: "border-l-emerald-500",
      iconWrap: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Sales This Month",
      value: String(data.monthlySalesCount),
      sub: data.monthlySalesCount > 0 ? `Revenue: ${formatCurrency(data.monthlyRevenue)}` : "No sales this month",
      icon: Receipt,
      accent: "border-l-violet-500",
      iconWrap: "bg-violet-100 text-violet-700",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(data.monthlyRevenue),
      sub: "This calendar month",
      icon: IndianRupee,
      accent: "border-l-rose-500",
      iconWrap: "bg-rose-100 text-rose-700",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="GahnaGhar"
        title="Dashboard"
        description="A quick read on stock weight, live rates, and how sales are tracking this month."
        action={
          <LinkButton href="/stock/new" className="h-10 w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </LinkButton>
        }
      />

      <section className="space-y-4">
        <div>
          <h2>Inventory snapshot</h2>
          <p className="text-muted-foreground mt-1">Stock counts and metal value at today&apos;s rates.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statCards.map(({ title, value, sub, icon: Icon, accent, iconWrap }) => (
            <Card key={title} className={`border-l-4 ${accent} shadow-sm`}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
                <div className={`rounded-xl p-2.5 ${iconWrap}`}>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-bold tracking-tight">{value}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2>Live rates</h2>
          <p className="text-muted-foreground mt-1">Pure metal prices used for market value calculations.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            { metal: "Gold", rate: data.goldRate, updated: data.goldRateUpdated, tone: "border-amber-200 bg-amber-50/70" },
            { metal: "Silver", rate: data.silverRate, updated: data.silverRateUpdated, tone: "border-slate-200 bg-slate-50/80" },
          ].map(({ metal, rate, updated, tone }) => (
            <Card key={metal} className={`${tone} shadow-sm`}>
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-base font-medium text-muted-foreground">{metal} rate per gram</p>
                  {rate != null ? (
                    <>
                      <p className="text-2xl font-bold">₹{rate.toLocaleString("en-IN")}</p>
                      {updated && (
                        <p className="text-sm text-muted-foreground">
                          Updated {new Date(updated).toLocaleString("en-IN")}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-base text-muted-foreground">Not set yet</p>
                  )}
                </div>
                <LinkButton variant="outline" href="/rates" className="w-full sm:w-auto">
                  Update Rate
                </LinkButton>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {data.recentSales.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2>Recent sales</h2>
              <p className="text-muted-foreground mt-1">Latest transactions across gold and silver.</p>
            </div>
            <LinkButton variant="outline" href="/sales" className="w-full sm:w-auto">
              View All
            </LinkButton>
          </div>
          <Card className="shadow-sm">
            <CardContent className="divide-y p-0">
              {data.recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-semibold">{sale.item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {sale.item.itemCode} · {sale.item.type} · {new Date(sale.soldAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-emerald-700">{formatCurrency(sale.sellingPrice)}</p>
                      <p className="text-sm text-muted-foreground">₹{sale.ratePerGram.toLocaleString("en-IN")}/g</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        sale.item.metal === "GOLD"
                          ? "bg-amber-50 text-amber-800 border-amber-200 text-sm px-3 py-1"
                          : "bg-slate-50 text-slate-700 border-slate-200 text-sm px-3 py-1"
                      }
                    >
                      {sale.item.metal === "GOLD" ? "Gold" : "Silver"}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {data.totalItems === 0 && data.recentSales.length === 0 && (
        <Card className="border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-muted-foreground">
            <Gem className="h-14 w-14 opacity-25" />
            <div className="text-center space-y-2">
              <p className="font-semibold text-foreground">No items in inventory yet</p>
              <p>Start by adding your first jewellery item to stock.</p>
            </div>
            <LinkButton href="/stock/new">
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </LinkButton>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
