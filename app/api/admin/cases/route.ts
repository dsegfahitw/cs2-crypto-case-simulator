import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const dbCases = await prisma.case.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
    
    const formattedCases = dbCases.map(c => ({
      id: c.id,
      name: c.title,
      price: c.price,
      image: c.imageUrl || '',
      category: c.category,
      isActive: c.isActive, // Додали статус приватності
      items: c.items.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        chance: i.chance,
        image: i.imageUrl || '',
        rarity: i.rarity // Додали рідкість
      }))
    }));

    return NextResponse.json({ success: true, cases: formattedCases });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, price, image, category, isActive, items } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ success: false, message: "Name and price are required." }, { status: 400 });
    }

    const isNew = !id || id.startsWith('new-');
    const caseIsActive = isActive !== undefined ? isActive : false; // За замовчуванням приватний

    if (isNew) {
      const newCase = await prisma.case.create({
        data: {
          title: name, price, imageUrl: image || '', category: category || 'NEW', isActive: caseIsActive,
          items: {
            create: items.map((item: any) => ({
              name: item.name, price: item.price, chance: item.chance, imageUrl: item.image || '', rarity: item.rarity || 'COMMON'
            }))
          }
        },
        include: { items: true }
      });
      return NextResponse.json({ success: true, case: newCase });
    } else {
      const updatedCase = await prisma.$transaction(async (tx) => {
        await tx.item.deleteMany({ where: { caseId: id } });
        return await tx.case.update({
          where: { id },
          data: {
            title: name, price, imageUrl: image, category, isActive: caseIsActive,
            items: {
              create: items.map((item: any) => ({
                name: item.name, price: item.price, chance: item.chance, imageUrl: item.image || '', rarity: item.rarity || 'COMMON'
              }))
            }
          },
          include: { items: true }
        });
      });
      return NextResponse.json({ success: true, case: updatedCase });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// НОВИЙ МЕТОД ДЛЯ ВИДАЛЕННЯ КЕЙСУ
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: "ID is required" }, { status: 400 });

    await prisma.case.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Case deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}