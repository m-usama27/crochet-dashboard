import { prisma } from '@/lib/prisma';
import { fmtPKR, fmtGrams } from '@/lib/format';
import { saveYarn, deleteYarn, restockYarn } from './actions';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function getYarns() {
  return prisma.yarn.findMany({ orderBy: { brand: 'asc' } });
}

export default async function YarnsPage() {
  const yarns = await getYarns();
  const totalValue = yarns.reduce((s, y) => s + y.stockGrams * y.costPerGram, 0);
  const lowCount = yarns.filter((y) => y.reorderAt && y.stockGrams <= y.reorderAt).length;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">🧶 Yarn Stock</h2>
          <p className="text-sm text-gray-500 mt-1">
            {yarns.length} SKUs · Total value {fmtPKR(totalValue)} ·{' '}
            {lowCount > 0 ? (
              <span className="text-red-600 font-medium">{lowCount} low stock</span>
            ) : (
              'All stock healthy'
            )}
          </p>
        </div>
        <a href="#new-yarn" className="btn-primary">+ Add Yarn</a>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Brand</th>
              <th>Color</th>
              <th>Weight</th>
              <th className="text-right">Stock</th>
              <th className="text-right">Cost/g</th>
              <th className="text-right">Value</th>
              <th>Supplier</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {yarns.map((y) => {
              const low = y.reorderAt != null && y.stockGrams <= y.reorderAt;
              return (
                <tr key={y.id}>
                  <td className="font-mono text-xs">{y.sku}</td>
                  <td className="font-medium">{y.brand}</td>
                  <td>{y.color}</td>
                  <td><span className="badge bg-lilac-100 text-lilac-700">{y.weightType}</span></td>
                  <td className="text-right">{fmtGrams(y.stockGrams)}</td>
                  <td className="text-right">{fmtPKR(y.costPerGram)}</td>
                  <td className="text-right font-medium">{fmtPKR(y.stockGrams * y.costPerGram)}</td>
                  <td className="text-xs text-gray-500">{y.supplier || '—'}</td>
                  <td>
                    {low ? (
                      <span className="badge bg-red-100 text-red-700">⚠ Low</span>
                    ) : (
                      <span className="badge bg-mint-100 text-mint-600">OK</span>
                    )}
                  </td>
                  <td>
                    <details>
                      <summary className="cursor-pointer text-xs text-peach-600">Restock</summary>
                      <form action={restockYarn} className="mt-2 flex gap-1">
                        <input type="hidden" name="yarnId" value={y.id} />
                        <input name="grams" type="number" placeholder="grams" required className="input w-20 text-xs py-1" />
                        <input name="costTotal" type="number" placeholder="cost" required className="input w-20 text-xs py-1" />
                        <input name="supplier" placeholder="supplier" className="input w-24 text-xs py-1" />
                        <button className="btn-primary text-xs py-1 px-2">+</button>
                      </form>
                    </details>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New Yarn Form */}
      <div id="new-yarn" className="card">
        <h3 className="font-semibold mb-3">Add New Yarn</h3>
        <form action={saveYarn} className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><label className="label">SKU</label><input name="sku" required className="input" placeholder="YRN-007" /></div>
          <div><label className="label">Brand</label><input name="brand" required className="input" /></div>
          <div><label className="label">Color</label><input name="color" required className="input" /></div>
          <div>
            <label className="label">Weight</label>
            <select name="weightType" required className="input">
              <option>Sport</option><option>DK</option><option>Worsted</option><option>Bulky</option>
            </select>
          </div>
          <div><label className="label">Stock (grams)</label><input name="stockGrams" type="number" step="0.1" required className="input" /></div>
          <div><label className="label">Cost / gram (Rs)</label><input name="costPerGram" type="number" step="0.01" required className="input" /></div>
          <div><label className="label">Supplier</label><input name="supplier" className="input" /></div>
          <div><label className="label">Reorder alert at (g)</label><input name="reorderAt" type="number" step="0.1" className="input" placeholder="e.g. 500" /></div>
          <div className="flex items-end"><button className="btn-primary w-full">Save Yarn</button></div>
        </form>
      </div>
    </div>
  );
}