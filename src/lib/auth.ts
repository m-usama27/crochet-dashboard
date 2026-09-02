// Server-side auth helpers
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { getSessionOptions, type SessionData } from './session';

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), getSessionOptions());
}

export async function requireUser() {
  const session = await getSession();
  if (!session.userId) {
    redirect('/login');
  }
  return { userId: session.userId, username: session.username! };
}

export async function getOptionalUser() {
  const session = await getSession();
  return session.userId
    ? { userId: session.userId, username: session.username! }
    : null;
}