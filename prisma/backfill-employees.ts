// One-off backfill: create Employee rows from any SalaryRecord rows that
// still only have the legacy free-text `employeeName`, and link them.
// Safe to re-run — it only touches rows where `employeeId` is still null.
//
//   pnpm db:backfill-employees
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orphans = await prisma.salaryRecord.findMany({
    where: { employeeId: null, employeeName: { not: null } },
    select: { employeeName: true },
    distinct: ['employeeName'],
  });

  if (orphans.length === 0) {
    console.log('✓ Nothing to backfill — every salary record is already linked.');
    return;
  }

  let created = 0;
  for (const { employeeName } of orphans) {
    const raw = (employeeName || '').trim();
    if (!raw) continue;

    // "Saeeda (Senior Crocheter)" → name: Saeeda, role: Senior Crocheter
    const match = raw.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    const name = (match ? match[1] : raw).trim();
    const role = match ? match[2].trim() : null;

    // Reuse an existing employee with the same name if one is already there
    let employee = await prisma.employee.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (!employee) {
      employee = await prisma.employee.create({ data: { name, role } });
      created++;
      console.log(`  + Created employee: ${name}${role ? ` (${role})` : ''}`);
    }

    const res = await prisma.salaryRecord.updateMany({
      where: { employeeId: null, employeeName: raw },
      data: { employeeId: employee.id },
    });
    console.log(`  → Linked ${res.count} salary record(s) to ${name}`);
  }

  console.log(`✅ Backfill complete — ${created} employee(s) created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
