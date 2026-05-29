import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ success: false, authorized: false });
  }

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ success: false, authorized: false });

    const currentInventoryCount = await prisma.inventory.count({
      where: { userId: session.userId, status: 'IN_INVENTORY' },
    });
    const soldInventoryCount = await prisma.inventory.count({
      where: { userId: session.userId, status: 'SOLD' },
    });

    return NextResponse.json({
      success: true,
      authorized: true,
      steamId: user.steamId,
      username: user.username,
      balance: user.balance,
      avatarUrl: user.avatarUrl,
      role: user.role,
      nonce: user.nonce,
      createdAt: user.createdAt,
      tradeUrl: user.tradeUrl,
      stats: {
        currentItems: currentInventoryCount,
        totalSold: soldInventoryCount,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Failed to load profile.' }, { status: 500 });
  }
}
