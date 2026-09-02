import { prisma } from '@/lib/prisma';
import NewProductForm from './NewProductForm';

export const dynamic = 'force-dynamic';

export default async function NewProductPage() {
  const yarns = await prisma.yarn.findMany({
    orderBy: [{ brand: 'asc' }, { color: 'asc' }],
  });
  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">🧸 New Product</h2>
      {yarns.length === 0 ? (
        <div className="card bg-sun-50 border-sun-200">
          ⚠ You need to add yarn first before creating products.{' '}
          <a href="/yarns" className="text-peach-600 underline">Add yarn →</a>
        </div>
      ) : (
        <NewProductForm yarns={yarns.map(y => ({ id: y.id, brand: y.brand, color: y.color, stockGrams: y.stockGrams }))} />
      )}
    </div>
  );
}