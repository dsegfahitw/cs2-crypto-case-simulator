import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import crypto from 'crypto';

// Ініціалізація Prisma з правильним адаптером
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Спрощений алгоритм Provably Fair для Апгрейду
function rollUpgrade(chance: number, serverSeed: string, clientSeed: string, nonce: number) {
  const combined = `${serverSeed}-${clientSeed}-${nonce}-upgrade`;
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  const intNumber = parseInt(hash.substring(0, 8), 16);
  const roll = (intNumber / 4294967295) * 100; // від 0 до 100
  return { isWin: roll <= chance, roll, hash };
}

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const userRes = await fetch(new URL('/api/user-profile', req.url), { headers: { cookie: cookieHeader || '' } });
    const userData = await userRes.json();

    if (!userData.success || !userData.authorized) {
      return NextResponse.json({ success: false, message: "Не авторизовано!" }, { status: 401 });
    }

    const { inventoryId, targetItemId, clientSeed = "upgrade_seed" } = await req.json();

    // ФІКС: Отримуємо внутрішній UUID користувача з бази даних
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: userData.id || 'none' },
          { steamId: userData.steamId || 'none' }
        ]
      }
    });

    if (!dbUser) {
      throw new Error("Користувача не знайдено в базі.");
    }

    const userId = dbUser.id;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Шукаємо предмет юзера
      const myInv = await tx.inventory.findUnique({ where: { id: inventoryId }, include: { item: true } });
      
      // Перевіряємо, чи існує предмет і чи він належить саме цьому UUID
      if (!myInv || myInv.userId !== userId || myInv.status !== 'IN_INVENTORY') {
        throw new Error("Предмет не знайдено в інвентарі.");
      }

      // 2. Шукаємо бажаний предмет
      const targetItem = await tx.item.findUnique({ where: { id: targetItemId } });
      if (!targetItem) throw new Error("Бажаний предмет не існує.");

      // 3. Рахуємо шанс (захист від шансу > 100%)
      let chance = (myInv.item.price / targetItem.price) * 100;
      if (chance >= 100) chance = 95; // Максимальний шанс 95%

      // 4. Отримуємо nonce юзера та крутимо рулетку
      const { isWin, roll, hash } = rollUpgrade(chance, process.env.SERVER_SEED || "seed", clientSeed, dbUser.nonce);

      // 5. Оновлюємо nonce
      await tx.user.update({ where: { id: userId }, data: { nonce: { increment: 1 } } });

      // 6. Забираємо старий предмет
      await tx.inventory.update({
        where: { id: inventoryId },
        data: { status: isWin ? 'UPGRADED' : 'LOST_UPGRADE' }
      });

      // 7. Якщо виграв - видаємо новий предмет
      let newInventoryId = null;
      if (isWin) {
        const newItem = await tx.inventory.create({
          data: { userId: userId, itemId: targetItem.id, status: 'IN_INVENTORY' }
        });
        newInventoryId = newItem.id;
      }

      return { isWin, roll, chance, hash, newInventoryId, targetItem };
    });

    return NextResponse.json({ success: true, ...result });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}