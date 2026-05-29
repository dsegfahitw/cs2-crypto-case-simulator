import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST() {
  try {
    const userId = await requireAuth();
    const prisma = getPrisma();

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found.');

      if (user.lastDailyCaseAt) {
        const timePassed = Date.now() - new Date(user.lastDailyCaseAt).getTime();
        if (timePassed < 24 * 60 * 60 * 1000) {
          throw new Error('Daily case not available yet. Come back later!');
        }
      }

      const dailyCase = await tx.case.findUnique({
        where: { id: 'free-case-1' },
        include: { items: true },
      });

      if (!dailyCase || dailyCase.items.length === 0) {
        throw new Error('Daily case is temporarily unavailable.');
      }

      const serverSeed = process.env.SERVER_SEED || 'fallback_server_seed';
      const nonce = user.nonce;
      const combinedString = `${serverSeed}-daily-${userId}-${nonce}`;
      const hash = crypto.createHash('sha256').update(combinedString).digest('hex');
      const hexSubstring = hash.substring(0, 8);
      const intNumber = parseInt(hexSubstring, 16);
      const rolledRoll = (intNumber / 4294967295) * 100;

      let rolledItem = null;
      let accumulatedChance = 0;
      for (const item of dailyCase.items) {
        accumulatedChance += item.chance;
        if (rolledRoll <= accumulatedChance) {
          rolledItem = item;
          break;
        }
      }
      if (!rolledItem) rolledItem = dailyCase.items[dailyCase.items.length - 1];

      await tx.user.update({
        where: { id: userId },
        data: { lastDailyCaseAt: new Date() },
      });

      const newInventoryRecord = await tx.inventory.create({
        data: { userId, itemId: rolledItem.id, status: 'IN_INVENTORY' },
        include: { item: true },
      });

      return newInventoryRecord.item;
    });

    return NextResponse.json({ success: true, item: result });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, authorized: false }, { status: 401 });
    }
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Server error.' },
      { status: 400 }
    );
  }
}
