'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addEmployee, toggleEmployee, deleteEmployee } from './actions';

type Employee = {
  id: string;
  name: string;
  role: string | null;
  active: boolean;
  _count: { salaries: number; productions: number };
};

export default function EmployeeManager({ employees }: { employees: Employee[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function run(
    action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>,
    fd: FormData,
    onSuccess?: () => void,
  ) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await action(fd);
      if (result && 'ok' in result) {
        if (result.ok) {
          setSuccess(true);
          onSuccess?.();
          router.refresh();
        } else if (result.error) {
          setError(result.error);
        }
      }
    });
  }

  function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    run(addEmployee, fd, () => form.reset());
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">👥 Team</h3>
        <span className="text-xs text-gray-500">
          {employees.filter((e) => e.active).length} active · {employees.length} total
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 mb-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-mint-200 bg-mint-50 px-4 py-2 mb-3 text-sm text-mint-700">
          ✓ Saved
        </div>
      )}

      <form onSubmit={onAdd} className="flex flex-wrap items-end gap-3 mb-4">
        <div className="flex-1 min-w-[160px]">
          <label className="label">Name *</label>
          <input name="name" required className="input" placeholder="Saeeda" />
        </div>
        <div className="w-40">
          <label className="label">Role</label>
          <input name="role" className="input" placeholder="Crocheter" />
        </div>
        <button disabled={pending} className="btn-secondary disabled:opacity-50">+ Add</button>
      </form>

      <ul className="divide-y divide-gray-100">
        {employees.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className={`text-sm font-medium truncate ${e.active ? 'text-gray-900' : 'text-gray-400'}`}>
                {e.name}
                {e.role && <span className="text-gray-400 font-normal"> · {e.role}</span>}
              </p>
              <p className="text-xs text-gray-400">
                {e._count.productions} pieces · {e._count.salaries} salary records
                {!e.active && <span className="ml-2 text-gray-400">(inactive)</span>}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <form action={(fd) => run(toggleEmployee, fd)}>
                <input type="hidden" name="id" value={e.id} />
                <button disabled={pending} className="btn-secondary text-xs py-1 px-2 disabled:opacity-50">
                  {e.active ? 'Deactivate' : 'Reactivate'}
                </button>
              </form>
              <form action={(fd) => run(deleteEmployee, fd)}>
                <input type="hidden" name="id" value={e.id} />
                <button disabled={pending} className="btn-danger disabled:opacity-50" title="Delete (deactivates if they have records)">×</button>
              </form>
            </div>
          </li>
        ))}
        {employees.length === 0 && (
          <li className="py-4 text-center text-sm text-gray-500">
            No employees yet — add your team above.
          </li>
        )}
      </ul>
    </div>
  );
}
