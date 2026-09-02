'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const nav = [
  { href: '/', label: 'Dashboard', emoji: '📊' },
  { href: '/yarns', label: 'Yarn Stock', emoji: '🧶' },
  { href: '/products', label: 'Products', emoji: '🧸' },
  { href: '/production', label: 'Production', emoji: '🪡' },
  { href: '/orders', label: 'Orders', emoji: '🛍️' },
  { href: '/customers', label: 'Customers', emoji: '👤' },
  { href: '/expenditures', label: 'Expenditures', emoji: '💸' },
  { href: '/salaries', label: 'Salaries', emoji: '👥' },
];

export default function Sidebar({ username }: { username?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setOpen(false);
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-peach-100 px-3 py-2 flex items-center justify-between">
        <button
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="p-2 -ml-1 rounded-lg hover:bg-peach-50 active:bg-peach-100"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-peach-700">
          <span>🧶</span> Crochet Co.
        </div>
        <div className="w-9" /> {/* spacer to balance the burger */}
      </div>

      {/* Backdrop (mobile only) */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static top-0 left-0 z-50 h-screen w-64
          bg-gradient-to-b from-peach-50 via-lilac-50 to-mint-50
          p-4 border-r border-peach-100
          transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          flex flex-col
        `}
      >
        <div className="mb-6 px-2 flex items-center justify-between">
          <h1 className="text-lg font-bold text-peach-700 flex items-center gap-2">
            <span className="text-2xl">🧶</span> Crochet Co.
          </h1>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="lg:hidden p-1 -mr-1 rounded-lg hover:bg-white/60"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="space-y-1 flex-1">
          {nav.map((n) => {
            const isActive = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition
                  ${isActive
                    ? 'bg-white shadow-sm text-peach-700 font-semibold'
                    : 'text-gray-700 hover:bg-white/60'}
                `}
              >
                <span>{n.emoji}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* User + logout at bottom */}
        {username && (
          <div className="pt-3 mt-3 border-t border-peach-200/60">
            <div className="px-3 py-1 text-xs text-gray-500">
              Signed in as <span className="font-medium text-gray-700">{username}</span>
            </div>
            <button
              onClick={logout}
              className="w-full mt-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-700 hover:bg-red-50 transition"
            >
              <span>🚪</span> Sign out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
