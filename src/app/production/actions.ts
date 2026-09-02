'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// ─── Result type: never throw on business errors, return them ────────
type ActionResult = { ok: true } | { ok: false; error: string };

export async function logProduction(formData: FormData): Promise<ActionResult> {
  const productId = String(formData.get('productId') || '');
  const qty = Number(formData.get('qty') || 0);
  const laborHours = Number(formData.get('laborHours') || 0);
  const producedAt = new Date(String(formData.get('producedAt') || new Date()));
  const notes = String(formData.get('notes') || '');

  // ── Layer 1: input validation ──────────────────────────────────────
  if (!productId) return { ok: false, error: 'Please select a product.' };
  if (!Number.isFinite(qty) || qty <= 0) {
    return { ok: false, error: 'Quantity must be greater than zero.' };
  }
  if (!Number.isFinite(laborHours) || laborHours < 0) {
    return { ok: false, error: 'Labor hours cannot be negative.' };
  }

  // Pre-load the recipe (we already know the grams from it)
  const recipe = await prisma.recipeItem.findMany({
    where: { productId },
    include: { yarn: true },
  });
  if (recipe.length === 0) {
    return { ok: false, error: 'This product has no recipe — add yarn to its recipe first.' };
  }

  // ── Layer 2: transaction with FRESH stock re-read inside ───────────
  // The re-read inside the transaction is what prevents the race
  // condition. We also use an atomic conditional update so even if a
  // parallel request slips between read and write, the DB will refuse.
  try {
    await prisma.$transaction(async (tx) => {
      // Log the production first
      await tx.production.create({
        data: { productId, qty, laborHours, notes, producedAt },
      });

      for (const r of recipe) {
        const used = r.grams * qty;

        // Re-read the yarn's stock INSIDE the transaction
        const yarn = await tx.yarn.findUnique({ where: { id: r.yarnId } });
        if (!yarn) throw new Error(`Yarn ${r.yarnId} vanished`);
        if (yarn.stockGrams < used) {
          throw new InsufficientStockError(
            `${r.yarn.brand} ${r.yarn.color}: need ${used}g, only ${yarn.stockGrams.toFixed(0)}g available. Restock first.`,
          );
        }

        // Atomic conditional update: only decrement if stock is still enough
        // (defence in depth — if a parallel tx slipped in, this updates 0 rows)
        const result = await tx.yarn.updateMany({
          where: { id: r.yarnId, stockGrams: { gte: used } },
          data: { stockGrams: { decrement: used } },
        });
        if (result.count === 0) {
          throw new InsufficientStockError(
            `${r.yarn.brand} ${r.yarn.color} stock changed during save. Try again.`,
          );
        }

        await tx.stockMovement.create({
          data: {
            yarnId: r.yarnId,
            grams: -used,
            type: 'production',
            reason: `Produced ${qty}× product`,
            createdAt: producedAt,
          },
        });
      }
    });
  } catch (e) {
    if (e instanceof InsufficientStockError) return { ok: false, error: e.message };
    // Transaction was rolled back automatically — nothing was written
    console.error('logProduction failed:', e);
    return { ok: false, error: 'Could not save production. Please try again.' };
  }

  revalidatePath('/production');
  revalidatePath('/yarns');
  revalidatePath('/');
  return { ok: true };
}

// Custom error class so we can identify it inside the catch
class InsufficientStockError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'InsufficientStockError';
  }
}