import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const customerId = String(fd.get('customerId') || '');
  const channel = String(fd.get('channel') || 'in-person');
  const requestedStatus = String(fd.get('status') || '');
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

  // Full order value comes from the line items, not the paid amount.
  const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);

  // Validate payment so it can never misrepresent the order.
  if (!Number.isFinite(amountPaid) || amountPaid < 0) {
    return NextResponse.json(
      { error: 'Amount paid must be zero or more' },
      { status: 400 },
    );
  }
  if (amountPaid > total) {
    return NextResponse.json(
      { error: `Amount paid (${amountPaid}) cannot exceed the order total (${total})` },
      { status: 400 },
    );
  }

  // Auto-derive the payment status from how much was paid, so "paid" / "partial" /
  // "pending" can never contradict the recorded amounts.
  const derivedStatus =
    amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'pending';
  // "delivered" is a fulfillment tag and is only meaningful once fully paid.
  const status =
    requestedStatus === 'delivered' && amountPaid >= total
      ? 'delivered'
      : derivedStatus;

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