// Analytics: all derived metrics computed from raw data
// These are queried on demand — never stored

import { prisma } from './prisma';
import { startOfMonth, endOfMonth } from './format';
import { ALL_CHANNELS } from './channels';

// Sales-channel filter. Only order-derived metrics (revenue, collected, pending,
// top-selling products, trend revenue) are scoped to the channel. Expenditure and
// material cost are business overhead that isn't tagged to a channel, so they stay
// "all channels" — profit is therefore channel revenue minus overall costs.
export async function getDashboardMetrics(
  reference = new Date(),
  channel?: string,
) {
  const monthStart = startOfMonth(reference);
  const monthEnd = endOfMonth(reference);

  const isAll = !channel || channel === ALL_CHANNELS;

  // Revenue this month (only paid or partial orders count toward cash-in;
  // we report gross sales and amount collected separately)
  const orderWhere: { orderDate: { gte: Date; lte: Date }; channel?: string } = {
    orderDate: { gte: monthStart, lte: monthEnd },
  };
  if (!isAll) orderWhere.channel = channel;
  const ordersThisMonth = await prisma.order.findMany({
    where: orderWhere,
    include: { items: { include: { product: { include: { recipe: true } } } } },
  });
  const grossRevenue = ordersThisMonth.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.qty * i.unitPrice, 0),
    0,
  );
  const collected = ordersThisMonth.reduce((s, o) => s + o.amountPaid, 0);
  const pending = Math.max(0, grossRevenue - collected);

  // Expenditures this month
  const exp = await prisma.expenditure.findMany({
    where: { date: { gte: monthStart, lte: monthEnd } },
  });
  const salaries = await prisma.salaryRecord.findMany({
    where: { month: { gte: monthStart, lte: monthEnd } },
  });
  const totalExpenditure =
    exp.reduce((s, e) => s + e.amount, 0) +
    salaries.reduce((s, e) => s + e.amount, 0);

  // COGS this month (yarn used for products sold + produced)
  const productions = await prisma.production.findMany({
    where: { producedAt: { gte: monthStart, lte: monthEnd } },
    include: { product: { include: { recipe: { include: { yarn: true } } } } },
  });
  const materialCost = productions.reduce((sum, p) => {
    const perUnit = p.product.recipe.reduce(
      (s, r) => s + r.grams * r.yarn.costPerGram,
      0,
    );
    return sum + perUnit * p.qty;
  }, 0);

  const profit = grossRevenue - totalExpenditure - materialCost;
  const margin = grossRevenue > 0 ? (profit / grossRevenue) * 100 : 0;

  // Stock value
  const yarns = await prisma.yarn.findMany();
  const stockValue = yarns.reduce((s, y) => s + y.stockGrams * y.costPerGram, 0);
  const lowStock = yarns.filter(
    (y) => y.reorderAt != null && y.stockGrams <= y.reorderAt,
  );

  // Top products (by qty sold this month)
  const productSales = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of ordersThisMonth) {
    for (const i of o.items) {
      const key = i.productId;
      const existing = productSales.get(key) || {
        name: i.product.name,
        qty: 0,
        revenue: 0,
      };
      existing.qty += i.qty;
      existing.revenue += i.qty * i.unitPrice;
      productSales.set(key, existing);
    }
  }
  const topProducts = [...productSales.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Most-used yarn (by grams consumed in production this month)
  const yarnUsage = new Map<string, { name: string; grams: number }>();
  for (const p of productions) {
    for (const r of p.product.recipe) {
      const used = r.grams * p.qty;
      const existing = yarnUsage.get(r.yarnId) || {
        name: `${r.yarn.brand} ${r.yarn.color}`,
        grams: 0,
      };
      existing.grams += used;
      yarnUsage.set(r.yarnId, existing);
    }
  }
  const topYarns = [...yarnUsage.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.grams - a.grams)
    .slice(0, 5);

  // Units produced per product this month (how many of each product were made)
  const unitsProduced = productions.reduce((s, p) => s + p.qty, 0);
  const madePerProduct = new Map<
    string,
    { id: string; name: string; qty: number; laborHours: number }
  >();
  for (const p of productions) {
    const existing = madePerProduct.get(p.productId) || {
      id: p.productId,
      name: p.product.name,
      qty: 0,
      laborHours: 0,
    };
    existing.qty += p.qty;
    existing.laborHours += p.laborHours;
    madePerProduct.set(p.productId, existing);
  }
  const producedByProduct = [...madePerProduct.values()]
    .sort((a, b) => b.qty - a.qty || b.laborHours - a.laborHours)
    .slice(0, 5);

  // Last 6 months of revenue and expenditure (for trend chart)
  const trend: { month: string; revenue: number; expenditure: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    const s = startOfMonth(d);
    const e = endOfMonth(d);
    const [o, x, sa] = await Promise.all([
      prisma.order.findMany({
        where: {
          orderDate: { gte: s, lte: e },
          ...(!isAll ? { channel } : {}),
        },
        include: { items: true },
      }),
      prisma.expenditure.findMany({ where: { date: { gte: s, lte: e } } }),
      prisma.salaryRecord.findMany({ where: { month: { gte: s, lte: e } } }),
    ]);
    const r = o.reduce(
      (sum, ord) => sum + ord.items.reduce((ss, it) => ss + it.qty * it.unitPrice, 0),
      0,
    );
    const exp2 =
      x.reduce((ss, ex) => ss + ex.amount, 0) +
      sa.reduce((ss, sa) => ss + sa.amount, 0);
    trend.push({
      month: d.toLocaleString('en-US', { month: 'short' }),
      revenue: r,
      expenditure: exp2,
    });
  }

  // Expenditure by category
  const expByCat = new Map<string, number>();
  for (const e of exp) expByCat.set(e.category, (expByCat.get(e.category) || 0) + e.amount);
  for (const s of salaries)
    expByCat.set('salary', (expByCat.get('salary') || 0) + s.amount);
  const expenditureByCategory = [...expByCat.entries()].map(([category, amount]) => ({
    category,
    amount,
  }));

  return {
    channel: isAll ? ALL_CHANNELS : channel,
    grossRevenue,
    collected,
    pending,
    totalExpenditure,
    materialCost,
    profit,
    margin,
    stockValue,
    lowStock,
    topProducts,
    topYarns,
    unitsProduced,
    producedByProduct,
    trend,
    expenditureByCategory,
    orderCount: ordersThisMonth.length,
  };
}