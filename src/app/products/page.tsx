import { prisma } from '@/lib/prisma';
import { fmtPKR } from '@/lib/format';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getProducts() {
  return prisma.product.findMany({
    include: { recipe: { include: { yarn: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">🧸 Products</h2>
          <p className="text-sm text-gray-500 mt-1">
            {products.length} product{products.length === 1 ? '' : 's'} · Each has a recipe (yarn + grams) so stock auto-deducts on production
          </p>
        </div>
        <Link href="/products/new" className="btn-primary">+ New Product</Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => {
          const materialCost = p.recipe.reduce(
            (s, r) => s + r.grams * r.yarn.costPerGram,
            0,
          );
          const margin = p.sellingPrice > 0 ? ((p.sellingPrice - materialCost) / p.sellingPrice) * 100 : 0;
          return (
            <Link
              href={`/products/${p.id}`}
              key={p.id}
              className="card hover:shadow-md transition group"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-peach-600">{p.name}</h3>
                  <span className="badge bg-lilac-100 text-lilac-700 mt-1">{p.category}</span>
                </div>
                <span className="text-lg font-bold text-peach-600">{fmtPKR(p.sellingPrice)}</span>
              </div>
              {p.description && <p className="text-xs text-gray-500 mb-2">{p.description}</p>}
              <div className="text-xs text-gray-600 space-y-0.5 mt-3 pt-3 border-t border-gray-100">
                <div>🧶 Recipe: {p.recipe.map((r) => `${r.yarn.color} (${r.grams}g)`).join(', ')}</div>
                <div>⏱ Labor: {p.laborHours}h</div>
                <div>💰 Material cost: {fmtPKR(materialCost)} · Margin: {margin.toFixed(0)}%</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}