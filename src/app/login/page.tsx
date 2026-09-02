import { redirect } from 'next/navigation';
import { getOptionalUser } from '@/lib/auth';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  // If already logged in, send them to the dashboard
  const user = await getOptionalUser();
  if (user) redirect('/');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-peach-50 via-lilac-50 to-mint-50 p-4">
      <LoginForm />
    </div>
  );
}