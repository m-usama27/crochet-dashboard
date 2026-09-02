'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const yarnSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  brand: z.string().min(1, 'Brand is required'),
  color: z.string().min(1, 'Color is required'),
  weightType: z.string().min(1, 'Weight is required'),
  stockGrams: z.coerce.number().min(0, 'Stock cannot be negative'),
  costPerGram: z.coerce.number().min(0, 'Cost cannot be negative'),
  supplier: z.string().optional().nullable(),
  reorderAt: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function saveYarn(formData: FormData): Promise<void> {
  const result = await saveYarnImpl(formData);
  if (result && 'ok' in result && !result.ok) {
    throw new Error(result.error);
  }
}

// Lower-level version that returns a result, for client-side use
export async function saveYarnImpl(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = yarnSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || 'Invalid input' };
  }
  const { id, ...rest } = parsed.data;
  try {
    if (id) {
      await prisma.yarn.update({ where: { id }, data: rest });
    } else {
      await prisma.yarn.create({ data: rest });
    }
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return { ok: false, error: `SKU "${rest.sku}" already exists. Use a unique code.` };
    }
    return { ok: false, error: 'Could not save yarn.' };
  }
  revalidatePath('/yarns');
  revalidatePath('/');
  redirect('/yarns');
}

export async function deleteYarn(id: string) {
  await prisma.yarn.delete({ where: { id } });
  revalidatePath('/yarns');
}

export async function restockYarn(formData: FormData): Promise<void> {
  const result = await restockYarnImpl(formData);
  if (result && 'ok' in result && !result.ok) {
    // Form-based callers get a generic error; client components
    // should call restockYarnImpl directly to display the message.
    throw new Error(result.error);
  }
}

// Lower-level version that returns a result, for client-side use
export async function restockYarnImpl(formData: FormData): Promise<ActionResult> {
  const yarnId = String(formData.get('yarnId') || '');
  const grams = Number(formData.get('grams') || 0);
  const costTotal = Number(formData.get('costTotal') || 0);
  const supplier = (formData.get('supplier') as string) || null;

  if (!yarnId) return { ok: false, error: 'Missing yarn.' };
  if (!Number.isFinite(grams) || grams <= 0) {
    return { ok: false, error: 'Restock amount must be greater than zero.' };
  }
  if (costTotal < 0) return { ok: false, error: 'Cost cannot be negative.' };

  await prisma.$transaction([
    prisma.restock.create({ data: { yarnId, grams, costTotal, supplier } }),
    prisma.stockMovement.create({
      data: { yarnId, grams, type: 'restock', reason: 'Manual restock' },
    }),
    // Atomic increment — no race because it's a single statement
    prisma.yarn.update({
      where: { id: yarnId },
      data: { stockGrams: { increment: grams } },
    }),
  ]);
  revalidatePath('/yarns');
  revalidatePath('/');
  redirect('/yarns');
}