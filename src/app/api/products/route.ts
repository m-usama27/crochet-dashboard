import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const name = String(fd.get('name') || '').trim();
  const category = String(fd.get('category') || 'other');
  const description = String(fd.get('description') || '');
  const laborHours = Number(fd.get('laborHours') || 0);
  const sellingPrice = Number(fd.get('sellingPrice') || 0);

  if (!name || sellingPrice <= 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const yarnIds = fd.getAll('recipeYarnId').map(String);
  const gramsList = fd.getAll('recipeGrams').map((v) => Number(v));
  const recipe = yarnIds
    .map((yarnId, i) => ({ yarnId, grams: gramsList[i] }))
    .filter((r) => r.yarnId && r.grams > 0);

  const product = await prisma.product.create({
    data: {
      name, category, description, laborHours, sellingPrice,
      recipe: { create: recipe },
    },
  });
  revalidatePath('/products');
  revalidatePath('/');
  return NextResponse.redirect(new URL(`/products`, req.url), 303);
}