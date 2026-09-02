// iron-session configuration
// Sessions are stored in encrypted cookies. The password must be at least 32 chars.

export type SessionData = {
  userId?: string;
  username?: string;
  loggedInAt?: number;
};

function getSessionPassword(): string {
  const fromEnv = process.env.SESSION_PASSWORD;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[auth] SESSION_PASSWORD is not set (or is shorter than 32 characters). ' +
        'Set it in your Vercel project Environment Variables and in your local .env before starting the app.',
    );
  }
  // Local development only — never used in production.
  return 'dev-only-fallback-secret-please-do-not-use-in-production-32char';
}

// Computed lazily (per request) rather than at module load, so a missing
// SESSION_PASSWORD fails loudly at request time in production without
// breaking `next build` (which also runs with NODE_ENV=production).
export function getSessionOptions() {
  return {
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
}