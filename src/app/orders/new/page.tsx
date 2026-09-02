import { prisma } from '@/lib/prisma';
import NewOrderForm from './NewOrderForm';

export const dynamic = 'force-dynamic';

export default async function NewOrderPage() {
  const [products, customers] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: 'asc' } }),
    prisma.customer.findMany({ orderBy: { name: 'asc' } }),
  ]);
  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">🛍️ New Order</h2>
      {products.length === 0 ? (
        <p className="card">⚠ Create a product first.</p>
      ) : customers.length === 0 ? (
        <p className="card">⚠ Add a customer first (visit Customers page).</p>
      ) : (
        <NewOrderForm products={products} customers={customers} />
      )}
    </div>
  );
}