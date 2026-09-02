'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { logProduction } from './actions';

type Product = { id: string; name: string };

export default function LogProductionForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await logProduction(fd);
      if (result && 'ok' in result) {
        if (result.ok) {
          setSuccess(true);
          (e.target as HTMLFormElement).reset();
          router.refresh();
        } else {
          setError(result.error);
        }
      }
    });
  }

  if (products.length === 0) {
    return (
      <div className="card bg-sun-50 border-sun-200 text-sm">
        ⚠ Create a product first (with a recipe) before logging production.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <strong>⚠ Cannot log production:</strong> {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-sm text-mint-700">
          ✓ Production logged. Stock has been deducted.
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="label">Product *</label>
          <select name="productId" required className="input">
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Quantity *</label>
          <input name="qty" type="number" min="1" required className="input" placeholder="5" />
        </div>
        <div>
          <label className="label">Labor (hours)</label>
          <input name="laborHours" type="number" step="0.25" min="0" className="input" placeholder="10" />
        </div>
        <div>
          <label className="label">Date</label>
          <input
            name="producedAt"
            type="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            className="input"
          />
        </div>
        <div className="md:col-span-3">
          <label className="label">Notes</label>
          <input name="notes" className="input" placeholder="e.g. for pending orders + stock" />
        </div>
        <div className="flex items-end">
          <button disabled={pending} className="btn-primary w-full disabled:opacity-50">
            {pending ? 'Logging…' : 'Log & Deduct Stock'}
          </button>
        </div>
      </div>
    </form>
  );
}