import { prisma } from '@/lib/prisma';
import { fmtPKR } from '@/lib/format';
import { ALL_CHANNELS, channelLabel } from '@/lib/channels';
import ChannelFilter from '@/components/ChannelFilter';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const statusColor = (s: string) =>
  ({
    paid: 'bg-mint-100 text-mint-600',
    delivered: 'bg-lilac-100 text-lilac-700',
    partial: 'bg-sun-100 text-sun-600',
    pending: 'bg-red-100 text-red-700',
  }[s] || 'bg-gray-100 text-gray-700');

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string }>;
}) {
  const { channel } = await searchParams;
  const selected = channel || ALL_CHANNELS;
  const scoped = selected !== ALL_CHANNELS;

  const where = scoped ? { channel: selected } : {};
  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: true,
      items: { include: { product: true } },
    },
    orderBy: { orderDate: 'desc' },
  });

  const totalRevenue = orders.reduce(
    (s, o) => s + o.items.reduce((ss, i) => ss + i.qty * i.unitPrice, 0),
    0,
  );
  const totalCollected = orders.reduce((s, o) => s + o.amountPaid, 0);
  const totalPending = Math.max(0, totalRevenue - totalCollected);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">🛍️ Orders</h2>
          <p className="text-sm text-gray-500 mt-1">
            {orders.length} orders · {channelLabel(selected)} · Revenue{' '}
            {fmtPKR(totalRevenue)} · Pending {fmtPKR(totalPending)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ChannelFilter value={selected} />
          <Link href="/orders/new" className="btn-primary">+ New Order</Link>
        </div>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Items</th>
              <th className="text-right">Total</th>
              <th className="text-right">Paid</th>
              <th>Status</th>
              <th>Channel</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const total = o.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
              const due = Math.max(0, total - o.amountPaid);
              return (
                <tr key={o.id}>
                  <td className="text-xs text-gray-500">
                    {o.orderDate.toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="font-medium">{o.customer.name}</td>
                  <td className="text-xs">
                    {o.items.map((i) => `${i.qty}× ${i.product.name}`).join(', ')}
                  </td>
                  <td className="text-right font-medium">{fmtPKR(total)}</td>
                  <td className="text-right text-mint-600">
                    {fmtPKR(o.amountPaid)}
                    {due > 0 && (
                      <div className="text-xs text-red-600 font-medium">due {fmtPKR(due)}</div>
                    )}
                  </td>
                  <td><span className={`badge ${statusColor(o.status)}`}>{o.status}</span></td>
                  <td className="text-xs text-gray-500">{o.channel}</td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr><td colSpan={7} className="text-center py-6 text-gray-500">No orders yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}