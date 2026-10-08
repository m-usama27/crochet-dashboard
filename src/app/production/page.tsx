import { prisma } from '@/lib/prisma';
import { fmtGrams, fmtPKR } from '@/lib/format';
import Link from 'next/link';
import LogProductionForm from './LogProductionForm';

export const dynamic = 'force-dynamic';

export default async function ProductionPage() {
  const [productions, products, employees] = await Promise.all([
    prisma.production.findMany({
      include: { product: true, employee: true },
      orderBy: { producedAt: 'desc' },
      take: 50,
    }),
    prisma.product.findMany({ orderBy: { name: 'asc' } }),
    prisma.employee.findMany({ orderBy: [{ active: 'desc' }, { name: 'asc' }] }),
  ]);

  const activeEmployees = employees.filter((e) => e.active);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">🪡 Production Log</h2>
          <p className="text-sm text-gray-500 mt-1">
            Each entry auto-deducts yarn from stock based on the product recipe
          </p>
        </div>
        <Link href="#new" className="btn-primary">+ Log Production</Link>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr><th>Date</th><th>Product</th><th>Made By</th><th>Qty</th><th>Labor</th><th>Notes</th></tr>
          </thead>
          <tbody>
            {productions.map((p) => (
              <tr key={p.id}>
                <td className="text-xs text-gray-500">
                  {p.producedAt.toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}
                </td>
                <td className="font-medium">{p.product.name}</td>
                <td className="text-xs text-gray-600">
                  {p.employee ? p.employee.name : <span className="text-gray-400">—</span>}
                </td>
                <td><span className="badge bg-peach-100 text-peach-700">{p.qty}</span></td>
                <td className="text-xs text-gray-600">{p.laborHours}h</td>
                <td className="text-xs text-gray-500">{p.notes || '—'}</td>
              </tr>
            ))}
            {productions.length === 0 && (
              <tr><td colSpan={6} className="text-center py-6 text-gray-500">No production logged yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div id="new" className="card">
        <h3 className="font-semibold mb-3">Log New Production</h3>
        <LogProductionForm products={products} employees={activeEmployees} />
      </div>
    </div>
  );
}