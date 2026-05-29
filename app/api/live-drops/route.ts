import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    const prisma = getPrisma();
    const recentDrops = await prisma.inventory.findMany({
      take: 15,
      orderBy: { droppedAt: 'desc' },
      include: {
        item: true,
        user: { select: { username: true, avatarUrl: true } },
      },
    });
    return NextResponse.json({ success: true, drops: recentDrops });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Failed to load live drops.' }, { status: 500 });
  }
}
