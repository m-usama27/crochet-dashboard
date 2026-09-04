'use client';

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { monthKey, shiftMonth } from '@/lib/format';

// Client-side month selector. It updates the `?month=YYYY-MM` query parameter so
// the server-rendered dashboard re-runs its analytics scoped to the chosen month.
export default function MonthFilter({ month }: { month: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [year, mon] = month.split('-').map(Number);
  const ref = new Date(year, mon - 1, 1);

  const isCurrent = month === monthKey(new Date());
  const label = ref.toLocaleString('en-US', { month: 'short', year: 'numeric' });

  const goTo = useCallback(
    (d: Date) => {
      router.push(`${pathname}?month=${monthKey(d)}`);
      router.refresh();
    },
    [pathname, router],
  );

  return (
    <div className="flex items-center gap-1 bg-white rounded-xl border border-peach-100 shadow-sm px-1.5 py-1">
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => goTo(shiftMonth(ref, -1))}
        className="px-2 py-1 rounded-lg text-gray-500 hover:bg-peach-50 hover:text-gray-800 transition"
      >
        ‹
      </button>
      <span className="text-sm font-semibold text-gray-800 min-w-[7.5rem] text-center">
        {label}
      </span>
      <button
        type="button"
        aria-label="Next month"
        onClick={() => goTo(shiftMonth(ref, 1))}
        className="px-2 py-1 rounded-lg text-gray-500 hover:bg-peach-50 hover:text-gray-800 transition"
      >
        ›
      </button>
      <button
        type="button"
        onClick={() => goTo(new Date())}
        className={`ml-1 text-xs px-2.5 py-1 rounded-lg transition ${
          isCurrent
            ? 'bg-peach-100 text-peach-700 font-semibold'
            : 'text-gray-500 hover:bg-peach-50'
        }`}
      >
        Current
      </button>
    </div>
  );
}