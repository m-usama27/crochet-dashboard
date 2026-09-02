import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const username = String(body.username || '').trim();
  const password = String(body.password || '');

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Username and password are required' },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    // Same response time as wrong-password to avoid user enumeration
    await bcrypt.compare(password, '$2a$10$invalidsaltinvalidsaltinvalidsaltinvalidsalti');
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  // Set the session
  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  session.loggedInAt = Date.now();
  await session.save();

  // Track last login (fire-and-forget)
  prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}