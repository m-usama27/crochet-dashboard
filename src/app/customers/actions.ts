'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function addCustomer(formData: FormData) {
  await prisma.customer.create({
    data: {
      name: String(formData.get('name')),
      phone: String(formData.get('phone') || '') || null,
      instagram: String(formData.get('instagram') || '') || null,
      notes: String(formData.get('notes') || '') || null,
    },
  });
  revalidatePath('/customers');
  redirect('/customers');
}