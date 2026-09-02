import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const customerId = String(fd.get('customerId') || '');
  const channel = String(fd.get('channel') || 'in-person');
  const status = String(fd.get('status') || 'pending');
  const amountPaid = Number(fd.get('amountPaid') || 0);
  const orderDate = new Date(String(fd.get('orderDate') || new Date()));
  const notes = String(fd.get('notes') || '');

  if (!customerId) {
    return NextResponse.json({ error: 'Customer required' }, { status: 400 });
  }

  const productIds = fd.getAll('itemProductId').map(String);
  const qtys = fd.getAll('itemQty').map(Number);
  const prices = fd.getAll('itemPrice').map(Number);
  const items = productIds
    .map((productId, i) => ({ productId, qty: qtys[i], unitPrice: prices[i] }))
    .filter((i) => i.productId && i.qty > 0);

  if (items.length === 0) {
    return NextResponse.json({ error: 'Add at least one item' }, { status: 400 });
  }

  await prisma.order.create({
    data: {
      customerId, channel, status, amountPaid, orderDate, notes,
      items: { create: items },
    },
  });

  revalidatePath('/orders');
  revalidatePath('/');
  return NextResponse.json({ ok: true });
}