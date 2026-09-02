'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') || '/';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        setPending(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError('Network error — try again');
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 w-full max-w-sm">
      <div className="text-center">
        <div className="text-4xl mb-2">🧶</div>
        <h1 className="text-2xl font-bold text-gray-900">Crochet Co.</h1>
        <p className="text-sm text-gray-500 mt-1">Sign in to continue</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {error}
        </div>
      )}

      <div>
        <label className="label">Username</label>
        <input
          type="text"
          required
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input"
        />
      </div>
      <div>
        <label className="label">Password</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
      </div>

      <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-50">
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}