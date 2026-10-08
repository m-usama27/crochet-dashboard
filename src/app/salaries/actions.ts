'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function revalidatePeople() {
  revalidatePath('/salaries');
  revalidatePath('/production');
  revalidatePath('/');
}

export async function addSalary(formData: FormData) {
  const monthStr = String(formData.get('month'));
  const month = new Date(monthStr + '-01');
  const employeeId = String(formData.get('employeeId') || '');
  const amount = Number(formData.get('amount'));
  const status = String(formData.get('status') || 'pending');

  if (!employeeId) throw new Error('Please select an employee.');
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Amount must be greater than zero.');

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw new Error('Selected employee no longer exists.');

  await prisma.salaryRecord.create({
    data: { employeeId, employeeName: employee.name, amount, month, status },
  });
  revalidatePeople();
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

// ─── Employee management ────────────────────────────────────────────
type ActionResult = { ok: true } | { ok: false; error: string };

export async function addEmployee(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get('name') || '').trim();
  const role = String(formData.get('role') || '').trim();

  if (!name) return { ok: false, error: 'Employee name is required.' };

  const existing = await prisma.employee.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  });
  if (existing) return { ok: false, error: 'An employee with this name already exists.' };

  await prisma.employee.create({ data: { name, role: role || null } });
  revalidatePeople();
  return { ok: true };
}

export async function toggleEmployee(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get('id'));
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) return { ok: false, error: 'Employee not found.' };

  await prisma.employee.update({
    where: { id },
    data: { active: !employee.active },
  });
  revalidatePeople();
  return { ok: true };
}

export async function deleteEmployee(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get('id'));

  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) return { ok: false, error: 'Employee not found.' };

  // Never delete someone who still has history attached — deactivate
  // instead so historical rows keep their link.
  const [salaryCount, productionCount] = await Promise.all([
    prisma.salaryRecord.count({ where: { employeeId: id } }),
    prisma.production.count({ where: { employeeId: id } }),
  ]);
  if (salaryCount > 0 || productionCount > 0) {
    await prisma.employee.update({ where: { id }, data: { active: false } });
    revalidatePeople();
    return { ok: true };
  }

  await prisma.employee.delete({ where: { id } });
  revalidatePeople();
  return { ok: true };
}