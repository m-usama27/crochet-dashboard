'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createProduct(formData: FormData) {
  const name = String(formData.get('name'));
  const category = String(formData.get('category'));
  const description = String(formData.get('description') || '');
  const laborHours = Number(formData.get('laborHours') || 0);
  const sellingPrice = Number(formData.get('sellingPrice') || 0);
  // recipe: pairs of yarnId + grams
  const yarnIds = formData.getAll('recipeYarnId').map(String);
  const gramsList = formData.getAll('recipeGrams').map((v) => Number(v));
  const recipeData = yarnIds
    .map((yarnId, i) => ({ yarnId, grams: gramsList[i] }))
    .filter((r) => r.yarnId && r.grams > 0);

  const product = await prisma.product.create({
    data: {
      name, category, description, laborHours, sellingPrice,
      recipe: { create: recipeData },
    },
  });
  revalidatePath('/products');
  redirect(`/products/${product.id}`);
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath('/products');
}