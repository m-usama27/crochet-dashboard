'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fmtPKR } from '@/lib/format';

type Product = { id: string; name: string; sellingPrice: number };
type Customer = { id: string; name: string };

export default function NewOrderForm({ products, customers }: { products: Product[]; customers: Customer[] }) {
  const router = useRouter();
  const [items, setItems] = useState([{ productId: products[0]?.id || '', qty: 1, price: products[0]?.sellingPrice || 0 }]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [delivered, setDelivered] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function addItem() {
    const p = products[0];
    setItems([...items, { productId: p.id, qty: 1, price: p.sellingPrice }]);
  }
  function update(i: number, field: 'productId' | 'qty' | 'price', val: any) {
    const copy = [...items];
    if (field === 'productId') {
      const p = products.find((x) => x.id === val);
      copy[i] = { ...copy[i], productId: val, price: p?.sellingPrice || 0 };
    } else {
      copy[i] = { ...copy[i], [field]: Number(val) };
    }
    setItems(copy);
  }
  function remove(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  const total = items.reduce((s, i) => s + i.qty * i.price, 0);
  const overpaid = amountPaid > total;
  const pending = Math.max(0, total - amountPaid);

  // Payment status is always derived from what was actually paid so it can never
  // contradict the amounts. "Delivered" is an optional fulfillment tag that only
  // applies once the order is fully paid.
  const status = delivered && amountPaid >= total ? 'delivered' : amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'pending';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (overpaid) return;
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    items.forEach((i) => {
      fd.append('itemProductId', i.productId);
      fd.append('itemQty', String(i.qty));
      fd.append('itemPrice', String(i.price));
    });
    fd.set('status', status);
    fd.set('amountPaid', String(amountPaid));
    const res = await fetch('/api/orders', { method: 'POST', body: fd });
    if (res.ok) {
      router.push('/orders');
      router.refresh();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="label">Customer *</label>
          <select name="customerId" required className="input">
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Channel</label>
          <select name="channel" className="input">
            <option value="instagram">Instagram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="in-person">In-person</option>
            <option value="website">Website</option>
            <option value="food-story">Food Story</option>
          </select>
        </div>
        <div>
          <label className="label">Amount Paid (Rs)</label>
          <input
            name="amountPaid"
            type="number"
            min="0"
            value={amountPaid}
            onChange={(e) => setAmountPaid(Math.max(0, Number(e.target.value) || 0))}
            className="input"
          />
          {overpaid && (
            <p className="text-xs text-red-600 mt-1">
              Can't pay more than the total ({fmtPKR(total)}).
            </p>
          )}
        </div>
        <div>
          <span className="label">Status (auto)</span>
          <div className="flex items-center gap-2">
            <span className={`badge ${
              status === 'paid' ? 'bg-mint-100 text-mint-600'
              : status === 'delivered' ? 'bg-lilac-100 text-lilac-700'
              : status === 'partial' ? 'bg-sun-100 text-sun-600'
              : 'bg-red-100 text-red-700'
            }`}>{status}</span>
            {pending > 0 && status !== 'pending' && (
              <span className="text-xs text-gray-500">
                pending {fmtPKR(pending)}
              </span>
            )}
          </div>
          <label className="flex items-center gap-2 mt-2 text-sm text-gray-700">
            <input
              type="checkbox"
              disabled={amountPaid < total}
              checked={delivered && amountPaid >= total}
              onChange={(e) => setDelivered(e.target.checked)}
            />
            Delivered
          </label>
          {amountPaid < total && delivered && (
            <p className="text-xs text-red-600 mt-1">Mark as <b>paid</b> before delivering.</p>
          )}
        </div>
        <div>
          <label className="label">Order Date</label>
          <input name="orderDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="input" />
        </div>
        <div>
          <label className="label">Notes</label>
          <input name="notes" className="input" placeholder="optional" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Items</h3>
          <button type="button" onClick={addItem} className="btn-secondary text-xs">+ Add Item</button>
        </div>
        <div className="space-y-2">
          {items.map((i, idx) => (
            <div key={idx} className="flex gap-2">
              <select
                value={i.productId}
                onChange={(e) => update(idx, 'productId', e.target.value)}
                className="input flex-1"
              >
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Rs {p.sellingPrice})</option>)}
              </select>
              <input
                type="number"
                min="1"
                value={i.qty}
                onChange={(e) => update(idx, 'qty', e.target.value)}
                className="input w-20"
              />
              <input
                type="number"
                value={i.price}
                onChange={(e) => update(idx, 'price', e.target.value)}
                className="input w-28"
                placeholder="price"
              />
              <span className="flex items-center text-sm font-medium w-24 justify-end">
                Rs {(i.qty * i.price).toLocaleString()}
              </span>
              <button type="button" onClick={() => remove(idx)} className="btn-danger">×</button>
            </div>
          ))}
        </div>
        <div className="mt-3 text-right text-lg font-bold">Total: Rs {total.toLocaleString()}</div>
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? 'Saving…' : 'Create Order'}
      </button>
    </form>
  );
}