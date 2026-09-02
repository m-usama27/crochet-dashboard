import { prisma } from '@/lib/prisma';
import { fmtPKR } from '@/lib/format';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const statusColor = (s: string) =>
  ({
    paid: 'bg-mint-100 text-mint-600',
    delivered: 'bg-lilac-100 text-lilac-700',
    partial: 'bg-sun-100 text-sun-600',
    pending: 'bg-red-100 text-red-700',
  }[s] || 'bg-gray-100 text-gray-700');

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
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
  const totalPending = totalRevenue - totalCollected;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">🛍️ Orders</h2>
          <p className="text-sm text-gray-500 mt-1">
            {orders.length} orders · Revenue {fmtPKR(totalRevenue)} · Pending {fmtPKR(totalPending)}
          </p>
        </div>
        <Link href="/orders/new" className="btn-primary">+ New Order</Link>
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
                  <td className="text-right text-mint-600">{fmtPKR(o.amountPaid)}</td>
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