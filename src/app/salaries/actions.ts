'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function addSalary(formData: FormData) {
  const monthStr = String(formData.get('month'));
  const month = new Date(monthStr + '-01');
  const employeeName = String(formData.get('employeeName'));
  const amount = Number(formData.get('amount'));
  const status = String(formData.get('status') || 'pending');
  await prisma.salaryRecord.create({
    data: { employeeName, amount, month, status },
  });
  revalidatePath('/salaries');
  revalidatePath('/');
  redirect('/salaries');
}

export async function markSalaryPaid(formData: FormData) {
  const id = String(formData.get('id'));
  await prisma.salaryRecord.update({
    where: { id },
    data: { status: 'paid', paidOn: new Date() },
  });
  revalidatePath('/salaries');
}

export async function deleteSalary(formData: FormData) {
  const id = String(formData.get('id'));
  await prisma.salaryRecord.delete({ where: { id } });
  revalidatePath('/salaries');
}