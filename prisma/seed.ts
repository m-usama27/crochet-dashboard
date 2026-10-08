// Clean seed — wipes ALL business data and leaves an empty app.
//
// What it does:
//   1. Deletes every yarn, product, recipe, production, order, customer,
//      stock movement, restock, expenditure, salary record and employee.
//   2. PRESERVES your existing admin login (no password needed).
//      Only if there is no user at all will it create one — and then it
//      requires SEED_ADMIN_PASSWORD (8+ chars) in the environment.
//
//   pnpm db:seed
//
// Want the fake demo dataset instead?  pnpm db:seed-demo
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning database (all business data will be deleted)...');

  // Children first so foreign keys never block the wipe.
  // (Users are intentionally NOT touched — the admin login survives.)
  const wiped = await prisma.$transaction([
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.production.deleteMany(),
    prisma.recipeItem.deleteMany(),
    prisma.product.deleteMany(),
    prisma.stockMovement.deleteMany(),
    prisma.restock.deleteMany(),
    prisma.yarn.deleteMany(),
    prisma.expenditure.deleteMany(),
    prisma.salaryRecord.deleteMany(),
    prisma.employee.deleteMany(),
    prisma.customer.deleteMany(),
  ]);

  const labels = [
    'order items', 'orders', 'productions', 'recipes', 'products',
    'stock movements', 'restocks', 'yarns', 'expenditures',
    'salary records', 'employees', 'customers',
  ];
  wiped.forEach((r, i) => {
    if (r.count > 0) console.log(`  x ${labels[i]}: ${r.count} deleted`);
  });

  // --- Admin login -----------------------------------------------------
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log(`  ok: existing admin login preserved (${existingUsers} user(s))`);
  } else {
    const username = process.env.SEED_ADMIN_USERNAME || 'admin';
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!password || password.length < 8) {
      throw new Error(
        'No admin user exists and SEED_ADMIN_PASSWORD is not set (or is shorter than 8 characters). ' +
          'Set it in .env, then re-run: pnpm db:seed',
      );
    }
    await prisma.user.create({
      data: { username, passwordHash: await bcrypt.hash(password, 10) },
    });
    console.log(`  ok: admin user created: ${username}`);
  }

  console.log('Clean seed complete — the app is empty and ready for real data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
