import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const { inventoryId } = await req.json();
    const prisma = getPrisma();

    const result = await prisma.$transaction(async (tx) => {
      const inv = await tx.inventory.findUnique({
        where: { id: inventoryId },
        include: { item: true },
      });

      if (!inv || inv.userId !== userId || inv.status !== 'IN_INVENTORY') {
        throw new Error('Invalid or already-sold inventory item.');
      }

      await tx.inventory.update({
        where: { id: inventoryId },
        data: { status: 'SOLD' },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: inv.item.price } },
      });

      return updatedUser;
    });

    return NextResponse.json({ success: true, newBalance: result.balance });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, authorized: false }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 400 }
    );
  }
}
