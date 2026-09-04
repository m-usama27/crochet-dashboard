import { getDashboardMetrics } from '@/lib/analytics';
import { fmtPKR, fmtGrams, monthLabel, monthKey, parseMonthKey } from '@/lib/format';
import { TrendChart, TopBarChart, CategoryPie } from '@/components/Charts';
import MonthFilter from '@/components/MonthFilter';
import ChannelFilter from '@/components/ChannelFilter';
import { ALL_CHANNELS, channelLabel } from '@/lib/channels';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; channel?: string }>;
}) {
  const sp = await searchParams;
  const ref = parseMonthKey(sp.month); // defaults to the current month when absent/invalid
  const viewingNonCurrent = monthKey(ref) !== monthKey(new Date());
  const channel = sp.channel || ALL_CHANNELS;

  const m = await getDashboardMetrics(ref, channel);
  const today = new Date();
  const scoped = channel !== ALL_CHANNELS;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Overview for{' '}
            <span className="font-medium text-gray-700">{monthLabel(ref)}</span>
            {viewingNonCurrent ? ' · (not current month)' : ''} ·{' '}
            {today.toLocaleDateString('en-PK', { weekday: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <MonthFilter month={monthKey(ref)} />
          <ChannelFilter value={channel} month={monthKey(ref)} />
          <Link href="/production" className="btn-primary">
            + Log Production
          </Link>
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="stat-card border-l-4 border-peach-400">
          <span className="stat-label">
            Revenue · {channelLabel(channel)}
          </span>
          <span className="stat-value text-peach-700">{fmtPKR(m.grossRevenue)}</span>
          <span className="stat-delta text-gray-500">
            Collected {fmtPKR(m.collected)} · Pending {fmtPKR(m.pending)}
          </span>
        </div>
        <div className="stat-card border-l-4 border-lilac-400">
          <span className="stat-label">
            Expenditure{scoped ? ' · all channels' : ''}
          </span>
          <span className="stat-value text-lilac-700">{fmtPKR(m.totalExpenditure)}</span>
          <span className="stat-delta text-gray-500">
            Materials {fmtPKR(m.materialCost)} · Overhead incl. salary
          </span>
        </div>
        <div className="stat-card border-l-4 border-mint-400">
          <span className="stat-label">Net Profit</span>
          <span className={`stat-value ${m.profit >= 0 ? 'text-mint-700' : 'text-red-600'}`}>
            {fmtPKR(m.profit)}
          </span>
          <span className="stat-delta text-gray-500">
            Margin: {m.margin.toFixed(1)}%{scoped ? ' · vs all-ch. costs' : ''}
          </span>
        </div>
        <div className="stat-card border-l-4 border-sun-400">
          <span className="stat-label">Stock Value</span>
          <span className="stat-value text-sun-600">{fmtPKR(m.stockValue)}</span>
          <span className="stat-delta text-gray-500">
            {m.lowStock.length > 0 ? (
              <span className="text-red-600 font-medium">⚠ {m.lowStock.length} low-stock items</span>
            ) : (
              'All stock healthy'
            )}
          </span>
        </div>
      </div>

      {/* Low stock alert banner */}
      {m.lowStock.length > 0 && (
        <div className="card border-l-4 border-red-400 bg-red-50/50">
          <h3 className="font-semibold text-red-800 mb-2">⚠ Low Stock Alert</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {m.lowStock.map((y) => (
              <li key={y.id}>
                {y.brand} {y.color} — {fmtGrams(y.stockGrams)} remaining
                (reorder at {fmtGrams(y.reorderAt || 0)})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <h3 className="font-semibold mb-3">Revenue vs Expenditure (6 months)</h3>
          <TrendChart data={m.trend} />
        </div>
        <div className="card">
          <h3 className="font-semibold mb-3">Expenditure by Category</h3>
          {m.expenditureByCategory.length > 0 ? (
            <CategoryPie data={m.expenditureByCategory} />
          ) : (
            <p className="text-sm text-gray-500 py-8 text-center">No expenditures this month</p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-1">🧸 Units Produced (this month)</h3>
          <p className="text-xs text-gray-500 mb-3">
            {m.unitsProduced} unit{m.unitsProduced === 1 ? '' : 's'} made across{' '}
            {m.producedByProduct.length} product types
          </p>
          {m.producedByProduct.length > 0 ? (
            <TopBarChart
              data={m.producedByProduct.map((p) => ({ name: p.name, produced: p.qty }))}
              dataKey="produced"
              nameKey="name"
            />
          ) : (
            <p className="text-sm text-gray-500 py-8 text-center">No production this month yet</p>
          )}
        </div>
        <div className="card">
          <h3 className="font-semibold mb-3">
            🏆 Top-Selling Products · {channelLabel(channel)}
          </h3>
          {m.topProducts.length > 0 ? (
            <TopBarChart
              data={m.topProducts.map((p) => ({ name: p.name, sold: p.qty }))}
              dataKey="sold"
              nameKey="name"
            />
          ) : (
            <p className="text-sm text-gray-500 py-8 text-center">No sales for this channel & month</p>
          )}
        </div>
        <div className="card">
          <h3 className="font-semibold mb-3">🧶 Most-Used Yarn (this month)</h3>
          {m.topYarns.length > 0 ? (
            <TopBarChart
              data={m.topYarns.map((y) => ({ name: y.name, grams: y.grams }))}
              dataKey="grams"
              nameKey="name"
            />
          ) : (
            <p className="text-sm text-gray-500 py-8 text-center">No production logged yet</p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Link href="/yarns" className="btn-secondary">🧶 Manage Yarn</Link>
          <Link href="/products/new" className="btn-secondary">🧸 New Product</Link>
          <Link href="/production" className="btn-secondary">🪡 Log Production</Link>
          <Link href="/orders/new" className="btn-secondary">🛍️ New Order</Link>
          <Link href="/expenditures" className="btn-secondary">💸 Add Expense</Link>
        </div>
      </div>
    </div>
  );
}