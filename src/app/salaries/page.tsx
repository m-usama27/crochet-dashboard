import { prisma } from '@/lib/prisma';
import { fmtPKR } from '@/lib/format';
import { addSalary, markSalaryPaid, deleteSalary } from './actions';

export const dynamic = 'force-dynamic';

export default async function SalariesPage() {
  const salaries = await prisma.salaryRecord.findMany({
    orderBy: [{ month: 'desc' }, { employeeName: 'asc' }],
  });
  const total = salaries.reduce((s, x) => s + x.amount, 0);
  const paid = salaries.filter((s) => s.status === 'paid').reduce((s, x) => s + x.amount, 0);
  const pending = total - paid;
  const thisMonth = new Date().toISOString().slice(0, 7);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">👥 Salaries</h2>
        <p className="text-sm text-gray-500 mt-1">
          {salaries.length} records · Paid {fmtPKR(paid)} · Pending {fmtPKR(pending)}
        </p>
      </div>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr><th>Month</th><th>Employee</th><th className="text-right">Amount</th><th>Status</th><th>Paid On</th><th></th></tr>
          </thead>
          <tbody>
            {salaries.map((s) => (
              <tr key={s.id}>
                <td className="text-xs text-gray-500">
                  {s.month.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}
                </td>
                <td className="font-medium">{s.employeeName}</td>
                <td className="text-right">{fmtPKR(s.amount)}</td>
                <td>
                  {s.status === 'paid' ? (
                    <span className="badge bg-mint-100 text-mint-600">paid</span>
                  ) : (
                    <span className="badge bg-sun-100 text-sun-600">pending</span>
                  )}
                </td>
                <td className="text-xs text-gray-500">
                  {s.paidOn ? s.paidOn.toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }) : '—'}
                </td>
                <td className="flex gap-1">
                  {s.status !== 'paid' && (
                    <form action={markSalaryPaid}>
                      <input type="hidden" name="id" value={s.id} />
                      <button className="btn-secondary text-xs py-1 px-2">Mark paid</button>
                    </form>
                  )}
                  <form action={deleteSalary}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="btn-danger">×</button>
                  </form>
                </td>
              </tr>
            ))}
            {salaries.length === 0 && (
              <tr><td colSpan={6} className="text-center py-6 text-gray-500">No salary records yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Add Salary Record</h3>
        <form action={addSalary} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div><label className="label">Month *</label><input name="month" type="month" required defaultValue={thisMonth} className="input" /></div>
          <div><label className="label">Employee *</label><input name="employeeName" required className="input" placeholder="Saeeda" /></div>
          <div><label className="label">Amount (Rs) *</label><input name="amount" type="number" required className="input" /></div>
          <div>
            <label className="label">Status</label>
            <select name="status" defaultValue="pending" className="input">
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="flex items-end"><button className="btn-primary w-full">Add</button></div>
        </form>
      </div>
    </div>
  );
}