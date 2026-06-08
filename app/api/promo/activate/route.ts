import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const { code } = await req.json();

    if (!code || String(code).trim() === '') {
      return NextResponse.json({ success: false, message: 'Please enter a promo code.' }, { status: 400 });
    }

    const prisma = getPrisma();

    const result = await prisma.$transaction(async (tx) => {
      const promo = await tx.promoCode.findUnique({
        where: { code: String(code).toUpperCase().trim() },
        include: { activations: true },
      });

      if (!promo) throw new Error('This promo code does not exist.');

      if (promo.activations.length >= promo.maxUses) {
        throw new Error('This promo code has reached its usage limit.');
      }

      const alreadyActivated = promo.activations.some((act) => act.userId === userId);
      if (alreadyActivated) throw new Error('You have already activated this promo code.');

      await tx.promoActivation.create({
        data: { userId, promoId: promo.id },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: promo.reward } },
      });

      return { newBalance: updatedUser.balance, reward: promo.reward };
    });

    return NextResponse.json({
      success: true,
      message: `Success! +${result.reward} points added to your balance.`,
      newBalance: result.newBalance,
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
