import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const prisma = getPrisma();

    // 1. Перевіряємо роль користувача (чи це Адмін)
    const cookieHeader = req.headers.get('cookie');
    let isAdmin = false;

    if (cookieHeader) {
      try {
        const userRes = await fetch(new URL('/api/user-profile', req.url), { 
          headers: { cookie: cookieHeader } 
        });
        const userData = await userRes.json();
        if (userData.success && userData.authorized && userData.role === 'ADMIN') {
          isAdmin = true;
        }
      } catch (e) {
        console.error("Error checking admin status:", e);
      }
    }

    // 2. Отримуємо кейси: Адміни бачать усе, гравці — тільки публічні (isActive: true)
    const dbCases = await prisma.case.findMany({
      where: isAdmin ? {} : { isActive: true },
      include: { 
        items: {
          orderBy: { price: 'asc' } // Відразу сортуємо дроп від найдешевшого до найдорожчого
        } 
      },
      orderBy: { createdAt: 'asc' }
    });

    // 3. Форматуємо під фронтенд (title -> name, imageUrl -> image)
    const formattedCases = dbCases.map(c => ({
      id: c.id,
      name: c.title,
      price: c.price,
      image: c.imageUrl || '',
      category: c.category,
      isActive: c.isActive,
      items: c.items.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        chance: i.chance,
        image: i.imageUrl || '',
        rarity: i.rarity
      }))
    }));

    return NextResponse.json({ success: true, cases: formattedCases });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Failed to load cases.' }, { status: 500 });
  }
}