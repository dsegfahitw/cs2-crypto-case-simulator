import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Ініціалізація Prisma з адаптером Supabase
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function POST(req: NextRequest) {
  try {
    // 1. Перевірка авторизації
    const cookieHeader = req.headers.get('cookie');
    const userRes = await fetch(new URL('/api/user-profile', req.url), { headers: { cookie: cookieHeader || '' } });
    const userData = await userRes.json();

    if (!userData.success || !userData.authorized) {
      return NextResponse.json({ success: false, message: "Unauthorized!" }, { status: 401 });
    }

    const { amount, method } = await req.json();

    // 2. Валідація суми (мінімальний депозит $2.00)
    if (!amount || amount < 2) {
      return NextResponse.json({ success: false, message: "Minimum deposit amount is $2.00" }, { status: 400 });
    }

    // 3. Шукаємо внутрішній UUID юзера
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userData.id || 'none' },
          { steamId: userData.steamId || 'none' }
        ]
      }
    });

    if (!dbUser) throw new Error("User not found in DB.");

    // 4. Конвертація: 1 USD = 100 Points
    const pointsToGive = Math.floor(amount * 100);

    // 5. Імітація обробки платежу банком (затримка 2.5 секунди для саспенсу)
    await new Promise(resolve => setTimeout(resolve, 2500));

    // 6. Транзакція: записуємо чек і видаємо бали
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId: dbUser.id,
          amount: amount,
          points: pointsToGive,
          method: method || 'VISA',
          status: 'SUCCESS'
        }
      });

      const updatedUser = await tx.user.update({
        where: { id: dbUser.id },
        data: { balance: { increment: pointsToGive } }
      });

      return { transaction, newBalance: updatedUser.balance };
    });

    return NextResponse.json({ 
      success: true, 
      newBalance: result.newBalance, 
      points: pointsToGive,
      message: `Successfully deposited $${amount.toFixed(2)}!`
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}