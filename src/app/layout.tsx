import './globals.css';
import type { Metadata, Viewport } from 'next';
import Sidebar from '@/components/Sidebar';
import { getOptionalUser } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Bloom by NK',
  description: 'Manage inventory, production, sales & analytics',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#fb923c',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getOptionalUser();

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex">
          {user && <Sidebar username={user.username} />}
          <main className="flex-1 min-w-0 pt-14 lg:pt-0 px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
