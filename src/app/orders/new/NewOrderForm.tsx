'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Product = { id: string; name: string; sellingPrice: number };
type Customer = { id: string; name: string };

export default function NewOrderForm({ products, customers }: { products: Product[]; customers: Customer[] }) {
  const router = useRouter();
  const [items, setItems] = useState([{ productId: products[0]?.id || '', qty: 1, price: products[0]?.sellingPrice || 0 }]);
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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    items.forEach((i) => {
      fd.append('itemProductId', i.productId);
      fd.append('itemQty', String(i.qty));
      fd.append('itemPrice', String(i.price));
    });
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
          <label className="label">Status</label>
          <select name="status" className="input">
            <option value="pending">Pending</option>
            <option value="partial">Partial Paid</option>
            <option value="paid">Paid</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
        <div>
          <label className="label">Amount Paid (Rs)</label>
          <input name="amountPaid" type="number" defaultValue={0} className="input" />
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