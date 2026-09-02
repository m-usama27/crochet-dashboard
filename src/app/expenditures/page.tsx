import { prisma } from '@/lib/prisma';
import { fmtPKR } from '@/lib/format';
import { addExpenditure, deleteExpenditure } from './actions';

export const dynamic = 'force-dynamic';

const catColor: Record<string, string> = {
  rent: 'bg-lilac-100 text-lilac-700',
  utilities: 'bg-sun-100 text-sun-600',
  marketing: 'bg-peach-100 text-peach-700',
  salary: 'bg-mint-100 text-mint-600',
  misc: 'bg-gray-100 text-gray-700',
  materials: 'bg-red-100 text-red-700',
};

export default async function ExpendituresPage() {
  const exps = await prisma.expenditure.findMany({ orderBy: { date: 'desc' }, take: 100 });
  const total = exps.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">💸 Expenditures</h2>
        <p className="text-sm text-gray-500 mt-1">
          {exps.length} entries · Total {fmtPKR(total)}
        </p>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead><tr><th>Date</th><th>Category</th><th>Description</th><th className="text-right">Amount</th><th>Type</th><th></th></tr></thead>
          <tbody>
            {exps.map((e) => (
              <tr key={e.id}>
                <td className="text-xs text-gray-500">{e.date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td><span className={`badge ${catColor[e.category] || 'bg-gray-100 text-gray-700'}`}>{e.category}</span></td>
                <td className="text-sm">{e.description}</td>
                <td className="text-right font-medium">{fmtPKR(e.amount)}</td>
                <td className="text-xs">{e.recurring ? '🔁 recurring' : 'one-time'}</td>
                <td>
                  <form action={deleteExpenditure}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="btn-danger">×</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Add Expenditure</h3>
        <form action={addExpenditure} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="label">Category *</label>
            <select name="category" required className="input">
              <option value="materials">Materials (yarn, tools)</option>
              <option value="rent">Rent</option>
              <option value="utilities">Utilities (electricity, internet)</option>
              <option value="marketing">Marketing / Ads</option>
              <option value="misc">Miscellaneous</option>
            </select>
          </div>
          <div><label className="label">Amount (Rs) *</label><input name="amount" type="number" required className="input" /></div>
          <div><label className="label">Date *</label><input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="input" /></div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="recurring" /> Recurring
            </label>
          </div>
          <div className="md:col-span-3"><label className="label">Description</label><input name="description" className="input" /></div>
          <div className="flex items-end"><button className="btn-primary w-full">Add</button></div>
        </form>
      </div>
    </div>
  );
}