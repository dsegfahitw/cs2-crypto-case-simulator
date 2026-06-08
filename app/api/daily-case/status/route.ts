import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    const userId = await requireAuth();
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found.');

    if (!user.lastDailyCaseAt) {
      return NextResponse.json({ available: true });
    }

    const now = new Date();
    const lastOpened = new Date(user.lastDailyCaseAt);
    const cooldown = 24 * 60 * 60 * 1000;
    const timePassed = now.getTime() - lastOpened.getTime();

    if (timePassed >= cooldown) {
      return NextResponse.json({ available: true });
    }

    return NextResponse.json({ available: false, timeLeft: cooldown - timePassed });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ available: false, authorized: false });
    }
    return NextResponse.json({ success: false, error: 'Failed to check daily case status.' }, { status: 500 });
  }
}
