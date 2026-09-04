'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ALL_CHANNELS, CHANNELS } from '@/lib/channels';

// Client-side channel selector. Updates the `?channel=value` query parameter,
// preserving any existing `month` filter so both filters combine cleanly.
// `value` should be a channel value or ALL_CHANNELS ("all").
export default function ChannelFilter({
  value,
  month,
}: {
  value: string;
  month?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    const params = new URLSearchParams();
    if (month) params.set('month', month);
    if (next !== ALL_CHANNELS) params.set('channel', next);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    router.refresh();
  }

  return (
    <select
      aria-label="Filter by channel"
      value={value}
      onChange={onChange}
      className="input w-auto pr-8"
    >
      <option value={ALL_CHANNELS}>All channels</option>
      {CHANNELS.map((c) => (
        <option key={c.value} value={c.value}>
          {c.label}
        </option>
      ))}
    </select>
  );
}