import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import crypto from 'crypto';

function openCaseProvablyFair(
  items: { id: string; name: string; price: number; chance: number; imageUrl: string | null; caseId: string }[],
  serverSeed: string,
  clientSeed: string,
  nonce: number
) {
  const combinedString = `${serverSeed}-${clientSeed}-${nonce}`;
  const hash = crypto.createHash('sha256').update(combinedString).digest('hex');
  const hexSubstring = hash.substring(0, 8);
  const intNumber = parseInt(hexSubstring, 16);
  const randomNumber = (intNumber / 4294967295) * 100;

  let currentBound = 0;
  for (const item of items) {
    currentBound += item.chance;
    if (randomNumber <= currentBound) {
      return { item, hash, randomNumber };
    }
  }
  return { item: items[items.length - 1], hash, randomNumber };
}

const userLastOpenTime = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();

    const now = Date.now();
    const lastOpen = userLastOpenTime.get(userId) ?? 0;
    if (now - lastOpen < 1500) {
      return NextResponse.json(
        { success: false, message: 'Please wait before opening another case.' },
        { status: 429 }
      );
    }
    userLastOpenTime.set(userId, now);

    const { caseId, clientSeed } = await req.json();
    const prisma = getPrisma();

    const currentCase = await prisma.case.findUnique({
      where: { id: caseId },
      include: { items: true },
    });

    if (!currentCase) {
      return NextResponse.json({ success: false, message: 'Case not found.' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found.');

      if (user.balance < currentCase.price) {
        throw new Error('Insufficient balance to open this case.');
      }

      const serverSeed = process.env.SERVER_SEED || 'fallback_server_seed';
      const nonce = user.nonce;
      const userSeed = clientSeed || 'default_client_seed';

      const dropResult = openCaseProvablyFair(currentCase.items, serverSeed, userSeed, nonce);
      const balanceAfterBuy = user.balance - currentCase.price;

      await tx.user.update({
        where: { id: userId },
        data: {
          balance: balanceAfterBuy,
          nonce: { increment: 1 },
        },
      });

      const newInventoryItem = await tx.inventory.create({
        data: {
          userId: user.id,
          itemId: dropResult.item.id,
          status: 'IN_INVENTORY',
        },
      });

      return {
        drop: dropResult.item,
        hash: dropResult.hash,
        randomNumber: dropResult.randomNumber,
        previousBalance: user.balance,
        balanceAfterBuy,
        inventoryId: newInventoryItem.id,
        nonce,
      };
    });

    return NextResponse.json({
      success: true,
      caseTitle: currentCase.title,
      casePrice: currentCase.price,
      user: {
        previousBalance: result.previousBalance.toFixed(2),
        balanceAfterBuy: result.balanceAfterBuy.toFixed(2),
        finalBalance: result.balanceAfterBuy.toFixed(2),
      },
      drop: result.drop,
      inventoryId: result.inventoryId,
      provablyFair: {
        hash: result.hash,
        number: result.randomNumber.toFixed(4),
        nonce: result.nonce,
      },
    });
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
