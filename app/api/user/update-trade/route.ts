import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth();
    const { tradeUrl } = await req.json();
    const prisma = getPrisma();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { tradeUrl },
    });

    return NextResponse.json({
      success: true,
      message: 'Trade URL saved successfully.',
      tradeUrl: updatedUser.tradeUrl,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, authorized: false }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: 'Failed to update trade URL.' }, { status: 500 });
  }
}
