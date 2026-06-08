import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

export async function getSession(): Promise<SessionData> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireAuth(): Promise<string> {
  const session = await getSession();
  if (!session.userId) {
    throw new Error('UNAUTHORIZED');
  }
  return session.userId;
}
