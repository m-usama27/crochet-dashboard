// iron-session configuration
// Sessions are stored in encrypted cookies. The password must be at least 32 chars.
// In production (Vercel) it's set via SESSION_PASSWORD env var.
// In dev, we fall back to a fixed dev-only secret.

export type SessionData = {
  userId?: string;
  username?: string;
  loggedInAt?: number;
};

function getSessionPassword(): string {
  const fromEnv = process.env.SESSION_PASSWORD;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  // Dev fallback. Never use this in production.
  return 'dev-only-fallback-secret-please-change-in-production-32chars';
}

export const sessionOptions = {
  cookieName: 'crochet_session',
  password: getSessionPassword(),
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};