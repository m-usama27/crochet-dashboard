import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Crochet Business Dashboard',
  description: 'Manage inventory, production, sales & analytics',
};

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex">
          <aside className="w-60 bg-gradient-to-b from-peach-50 via-lilac-50 to-mint-50 p-4 border-r border-peach-100 flex-shrink-0">
            <div className="mb-6 px-2">
              <h1 className="text-lg font-bold text-peach-700 flex items-center gap-2">
                <span className="text-2xl">🧶</span> Crochet Co.
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Business Dashboard</p>
            </div>
            <nav className="space-y-1">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-white hover:shadow-sm transition"
                >
                  <span>{n.emoji}</span>
                  {n.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">{children}</main>
        </div>
      </body>
    </html>
  );
}