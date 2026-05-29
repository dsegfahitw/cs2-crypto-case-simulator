import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET() {
  try {
    const prisma = getPrisma();
    const cases = await prisma.case.findMany({ include: { items: true } });
    return NextResponse.json({ success: true, cases });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Failed to load cases.' }, { status: 500 });
  }
}
