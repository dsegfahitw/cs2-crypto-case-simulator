import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    const userId = await requireAuth();
    const prisma = getPrisma();
    const data = await prisma.inventory.findMany({
      where: { userId, status: 'IN_INVENTORY' },
      include: { item: true },
    });
    return NextResponse.json({ success: true, inventory: data });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ success: false, authorized: false }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
