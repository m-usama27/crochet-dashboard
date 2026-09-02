import { prisma } from '@/lib/prisma';
import { fmtPKR, fmtGrams } from '@/lib/format';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      recipe: { include: { yarn: true } },
      productions: { orderBy: { producedAt: 'desc' }, take: 25 },
    },
  });

  if (!product) notFound();

  const materialCost = product.recipe.reduce(
    (s, r) => s + r.grams * r.yarn.costPerGram,
    0,
  );
  const margin =
    product.sellingPrice > 0
      ? ((product.sellingPrice - materialCost) / product.sellingPrice) * 100
      : 0;
  const totalProduced = product.productions.reduce((s, p) => s + p.qty, 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <Link href="/products" className="text-sm text-peach-600 underline mb-2 inline-block">
            &larr; All products
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{product.name}</h2>
          <p className="text-sm text-gray-500 mt-1">
            <span className="badge bg-lilac-100 text-lilac-700">{product.category}</span>{' '}
            {product.description || ''}
          </p>
        </div>
        <span className="text-3xl font-bold text-peach-600">{fmtPKR(product.sellingPrice)}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="stat-card border-l-4 border-peach-400">
          <span className="stat-label">Selling Price</span>
          <span className="stat-value text-peach-700">{fmtPKR(product.sellingPrice)}</span>
        </div>
        <div className="stat-card border-l-4 border-sun-400">
          <span className="stat-label">Material Cost</span>
          <span className="stat-value text-sun-600">{fmtPKR(materialCost)}</span>
        </div>
        <div className="stat-card border-l-4 border-mint-400">
          <span className="stat-label">Margin</span>
          <span className="stat-value text-mint-700">{margin.toFixed(0)}%</span>
        </div>
        <div className="stat-card border-l-4 border-lilac-400">
          <span className="stat-label">Total Produced</span>
          <span className="stat-value text-lilac-700">{totalProduced}</span>
        </div>
      </div>

      <div className="card table-wrap">
        <h3 className="font-semibold mb-3">🧶 Recipe (per unit)</h3>
        <table className="data">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Brand</th>
              <th>Color</th>
              <th className="text-right">Grams</th>
              <th className="text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {product.recipe.map((r) => (
              <tr key={r.id}>
                <td className="font-mono text-xs">{r.yarn.sku}</td>
                <td>{r.yarn.brand}</td>
                <td>{r.yarn.color}</td>
                <td className="text-right">{fmtGrams(r.grams)}</td>
                <td className="text-right">{fmtPKR(r.grams * r.yarn.costPerGram)}</td>
              </tr>
            ))}
            {product.recipe.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  No recipe defined — add yarn to this product to enable auto stock deduction.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card table-wrap">
        <h3 className="font-semibold mb-3">🪡 Production History</h3>
        <table className="data">
          <thead>
            <tr>
              <th>Date</th>
              <th className="text-right">Qty</th>
              <th className="text-right">Labor</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {product.productions.map((p) => (
              <tr key={p.id}>
                <td className="text-xs text-gray-500">
                  {p.producedAt.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="text-right">
                  <span className="badge bg-peach-100 text-peach-700">{p.qty}</span>
                </td>
                <td className="text-right text-xs text-gray-600">{p.laborHours}h</td>
                <td className="text-xs text-gray-500">{p.notes || '—'}</td>
              </tr>
            ))}
            {product.productions.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-500">
                  No production logged yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}