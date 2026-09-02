'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Yarn = { id: string; brand: string; color: string; stockGrams: number };

export default function NewProductForm({ yarns }: { yarns: Yarn[] }) {
  const router = useRouter();
  const [rows, setRows] = useState([{ yarnId: yarns[0]?.id || '', grams: 0 }]);
  const [submitting, setSubmitting] = useState(false);

  function addRow() {
    setRows([...rows, { yarnId: yarns[0]?.id || '', grams: 0 }]);
  }
  function removeRow(i: number) {
    setRows(rows.filter((_, idx) => idx !== i));
  }
  function updateRow(i: number, field: 'yarnId' | 'grams', value: any) {
    const copy = [...rows];
    copy[i] = { ...copy[i], [field]: value };
    setRows(copy);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    rows.forEach((r) => {
      fd.append('recipeYarnId', r.yarnId);
      fd.append('recipeGrams', String(r.grams));
    });
    const res = await fetch('/api/products', { method: 'POST', body: fd });
    if (res.redirected) {
      router.push(res.url);
    } else {
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="label">Product Name *</label>
          <input name="name" required className="input" placeholder="e.g. Lavender Bunny" />
        </div>
        <div>
          <label className="label">Category</label>
          <select name="category" required className="input">
            <option value="amigurumi">Amigurumi (stuffed toys)</option>
            <option value="garment">Garment</option>
            <option value="accessory">Accessory</option>
            <option value="home">Home Décor</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="label">Selling Price (Rs) *</label>
          <input name="sellingPrice" type="number" required className="input" placeholder="1500" />
        </div>
        <div>
          <label className="label">Labor Hours per unit</label>
          <input name="laborHours" type="number" step="0.25" className="input" placeholder="3" />
        </div>
        <div className="md:col-span-2">
          <label className="label">Description</label>
          <textarea name="description" className="input" rows={2} placeholder="Optional notes about the product" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Recipe (yarn + grams needed per unit)</h3>
          <button type="button" onClick={addRow} className="btn-secondary text-xs">+ Add Yarn</button>
        </div>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-2">
              <select
                value={r.yarnId}
                onChange={(e) => updateRow(i, 'yarnId', e.target.value)}
                className="input flex-1"
              >
                {yarns.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.brand} - {y.color} (stock: {y.stockGrams.toFixed(0)}g)
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={r.grams || ''}
                onChange={(e) => updateRow(i, 'grams', Number(e.target.value))}
                placeholder="grams"
                className="input w-32"
              />
              <button type="button" onClick={() => removeRow(i)} className="btn-danger">×</button>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? 'Saving…' : 'Create Product'}
      </button>
    </form>
  );
}