import { prisma } from '@/lib/prisma';
import { fmtPKR } from '@/lib/format';
import { addCustomer } from './actions';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    include: { orders: { include: { items: true } } },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">👤 Customers</h2>
        <p className="text-sm text-gray-500 mt-1">{customers.length} customers in your book</p>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Name</th><th>Phone</th><th>Instagram</th>
              <th className="text-right">Orders</th>
              <th className="text-right">Lifetime Value</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => {
              const ltv = c.orders.reduce(
                (s, o) => s + o.items.reduce((ss, i) => ss + i.qty * i.unitPrice, 0),
                0,
              );
              return (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}</td>
                  <td className="text-xs text-gray-500">{c.phone || '—'}</td>
                  <td className="text-xs text-gray-500">{c.instagram || '—'}</td>
                  <td className="text-right">{c.orders.length}</td>
                  <td className="text-right font-medium text-mint-600">{fmtPKR(ltv)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Add Customer</h3>
        <form action={addCustomer} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className="label">Name *</label><input name="name" required className="input" /></div>
          <div><label className="label">Phone</label><input name="phone" className="input" /></div>
          <div><label className="label">Instagram</label><input name="instagram" className="input" placeholder="@handle" /></div>
          <div><label className="label">Notes</label><input name="notes" className="input" /></div>
          <div className="md:col-span-4"><button className="btn-primary">Add Customer</button></div>
        </form>
      </div>
    </div>
  );
}