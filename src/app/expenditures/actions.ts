'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function addExpenditure(formData: FormData) {
  await prisma.expenditure.create({
    data: {
      category: String(formData.get('category')),
      amount: Number(formData.get('amount')),
      date: new Date(String(formData.get('date'))),
      recurring: formData.get('recurring') === 'on',
      description: String(formData.get('description') || ''),
    },
  });
  revalidatePath('/expenditures');
  revalidatePath('/');
  redirect('/expenditures');
}

export async function deleteExpenditure(formData: FormData) {
  const id = String(formData.get('id'));
  await prisma.expenditure.delete({ where: { id } });
  revalidatePath('/expenditures');
  revalidatePath('/');
}