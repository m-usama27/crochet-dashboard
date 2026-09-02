// Realistic seed data for a Pakistani crochet business
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ⚠️  Default admin credentials. Change this immediately after first login
//     in production by running the SQL or using the dashboard.
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123',
};

async function main() {
  console.log('🌱 Seeding database...');

  // Clean
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.production.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.restock.deleteMany();
  await prisma.yarn.deleteMany();
  await prisma.expenditure.deleteMany();
  await prisma.salaryRecord.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // ─── Admin user ───────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
  await prisma.user.create({
    data: {
      username: DEFAULT_ADMIN.username,
      passwordHash,
    },
  });
  console.log(`  ✓ Admin user created: ${DEFAULT_ADMIN.username} / ${DEFAULT_ADMIN.password}`);
  console.log('    ⚠ Change this password after first login!');

  // Yarns
  const yarns = await Promise.all([
    prisma.yarn.create({
      data: { sku: 'YRN-001', brand: 'Nako', color: 'Beige', weightType: 'Worsted', stockGrams: 2400, costPerGram: 4.5, supplier: 'Karachi Yarn House', reorderAt: 500 },
    }),
    prisma.yarn.create({
      data: { sku: 'YRN-002', brand: 'Nako', color: 'Sky Blue', weightType: 'Worsted', stockGrams: 1800, costPerGram: 4.5, supplier: 'Karachi Yarn House', reorderAt: 500 },
    }),
    prisma.yarn.create({
      data: { sku: 'YRN-003', brand: 'Ice Yarns', color: 'Mustard', weightType: 'DK', stockGrams: 900, costPerGram: 6.0, supplier: 'Lahore Wholesale', reorderAt: 400 },
    }),
    prisma.yarn.create({
      data: { sku: 'YRN-004', brand: 'Himalaya', color: 'Soft Pink', weightType: 'Sport', stockGrams: 1500, costPerGram: 5.2, supplier: 'Lahore Wholesale', reorderAt: 500 },
    }),
    prisma.yarn.create({
      data: { sku: 'YRN-005', brand: 'Nako', color: 'Forest Green', weightType: 'Worsted', stockGrams: 320, costPerGram: 4.5, supplier: 'Karachi Yarn House', reorderAt: 400 },
    }),
    prisma.yarn.create({
      data: { sku: 'YRN-006', brand: 'Ice Yarns', color: 'Cream White', weightType: 'DK', stockGrams: 1200, costPerGram: 6.0, supplier: 'Lahore Wholesale', reorderAt: 500 },
    }),
  ]);

  // Products with recipes
  const teddy = await prisma.product.create({
    data: {
      name: 'Classic Teddy Bear',
      category: 'amigurumi',
      description: 'Cuddly teddy bear, ~15cm',
      laborHours: 3,
      sellingPrice: 1500,
      recipe: {
        create: [
          { yarnId: yarns[0].id, grams: 80 },
          { yarnId: yarns[5].id, grams: 30 },
        ],
      },
    },
  });

  const sunflower = await prisma.product.create({
    data: {
      name: 'Sunflower Bouquet (3 stems)',
      category: 'home',
      description: '3 handmade sunflowers with stems',
      laborHours: 4,
      sellingPrice: 1800,
      recipe: {
        create: [
          { yarnId: yarns[2].id, grams: 120 },
          { yarnId: yarns[4].id, grams: 60 },
        ],
      },
    },
  });

  const beanie = await prisma.product.create({
    data: {
      name: 'Cozy Winter Beanie',
      category: 'garment',
      laborHours: 2.5,
      sellingPrice: 1200,
      recipe: {
        create: [{ yarnId: yarns[3].id, grams: 100 }],
      },
    },
  });

  const bunny = await prisma.product.create({
    data: {
      name: 'Pastel Bunny',
      category: 'amigurumi',
      laborHours: 3.5,
      sellingPrice: 1700,
      recipe: {
        create: [
          { yarnId: yarns[3].id, grams: 90 },
          { yarnId: yarns[5].id, grams: 20 },
        ],
      },
    },
  });

  const coaster = await prisma.product.create({
    data: {
      name: 'Mandala Coaster Set (4)',
      category: 'home',
      laborHours: 5,
      sellingPrice: 1400,
      recipe: {
        create: [{ yarnId: yarns[1].id, grams: 140 }],
      },
    },
  });

  // Customers
  const customers = await Promise.all([
    prisma.customer.create({ data: { name: 'Ayesha Khan', phone: '0300-1234567', instagram: '@ayesha.crochet' } }),
    prisma.customer.create({ data: { name: 'Fatima Ahmed', phone: '0321-9876543' } }),
    prisma.customer.create({ data: { name: 'Sana Malik', instagram: '@sana.handmade', notes: 'Loves pastel colors' } }),
    prisma.customer.create({ data: { name: 'Zainab Raza', phone: '0345-5551234' } }),
  ]);

  // Production log: last 14 days
  const productions = [
    { productId: teddy.id, qty: 8, daysAgo: 14 },
    { productId: teddy.id, qty: 12, daysAgo: 6 },
    { productId: sunflower.id, qty: 4, daysAgo: 12 },
    { productId: sunflower.id, qty: 6, daysAgo: 3 },
    { productId: beanie.id, qty: 10, daysAgo: 10 },
    { productId: bunny.id, qty: 7, daysAgo: 8 },
    { productId: bunny.id, qty: 5, daysAgo: 2 },
    { productId: coaster.id, qty: 3, daysAgo: 9 },
    { productId: coaster.id, qty: 2, daysAgo: 1 },
  ];
  for (const p of productions) {
    const date = new Date();
    date.setDate(date.getDate() - p.daysAgo);
    await prisma.production.create({
      data: {
        productId: p.productId,
        qty: p.qty,
        laborHours: p.qty * 2,
        producedAt: date,
      },
    });
    // Deduct stock
    const recipe = await prisma.recipeItem.findMany({
      where: { productId: p.productId },
      include: { yarn: true },
    });
    for (const r of recipe) {
      await prisma.stockMovement.create({
        data: {
          yarnId: r.yarnId,
          grams: -r.grams * p.qty,
          type: 'production',
          reason: `Produced ${p.qty}x product`,
          createdAt: date,
        },
      });
      await prisma.yarn.update({
        where: { id: r.yarnId },
        data: { stockGrams: { decrement: r.grams * p.qty } },
      });
    }
  }

  // Orders (all within this month)
  const orders = [
    { customerId: customers[0].id, daysAgo: 0, status: 'paid', amountPaid: 3000, channel: 'instagram', items: [{ productId: teddy.id, qty: 2, price: 1500 }] },
    { customerId: customers[1].id, daysAgo: 0, status: 'delivered', amountPaid: 1800, channel: 'whatsapp', items: [{ productId: sunflower.id, qty: 1, price: 1800 }] },
    { customerId: customers[2].id, daysAgo: 0, status: 'partial', amountPaid: 1000, channel: 'instagram', items: [{ productId: beanie.id, qty: 1, price: 1200 }] },
    { customerId: customers[3].id, daysAgo: 0, status: 'paid', amountPaid: 3400, channel: 'in-person', items: [{ productId: bunny.id, qty: 2, price: 1700 }] },
    { customerId: customers[0].id, daysAgo: 0, status: 'pending', amountPaid: 0, channel: 'instagram', items: [{ productId: coaster.id, qty: 1, price: 1400 }] },
    { customerId: customers[1].id, daysAgo: 0, status: 'paid', amountPaid: 5100, channel: 'whatsapp', items: [{ productId: teddy.id, qty: 1, price: 1500 }, { productId: bunny.id, qty: 2, price: 1800 }] },
    { customerId: customers[2].id, daysAgo: 0, status: 'paid', amountPaid: 3600, channel: 'instagram', items: [{ productId: sunflower.id, qty: 2, price: 1800 }] },
  ];

  for (const o of orders) {
    const date = new Date();
    date.setDate(date.getDate() - o.daysAgo);
    await prisma.order.create({
      data: {
        customerId: o.customerId,
        orderDate: date,
        channel: o.channel,
        status: o.status,
        amountPaid: o.amountPaid,
        items: {
          create: o.items.map((i) => ({ productId: i.productId, qty: i.qty, unitPrice: i.price })),
        },
      },
    });
  }

  // Expenditures this month
  const now = new Date();
  const expData = [
    { category: 'rent', amount: 35000, daysAgo: 25, desc: 'Studio rent September' },
    { category: 'utilities', amount: 8500, daysAgo: 22, desc: 'Electricity bill' },
    { category: 'utilities', amount: 3200, daysAgo: 18, desc: 'Internet' },
    { category: 'marketing', amount: 5000, daysAgo: 20, desc: 'Instagram ads' },
    { category: 'misc', amount: 2400, daysAgo: 15, desc: 'Packaging supplies' },
    { category: 'misc', amount: 1500, daysAgo: 8, desc: 'Shipping labels' },
  ];
  for (const e of expData) {
    const date = new Date();
    date.setDate(date.getDate() - e.daysAgo);
    await prisma.expenditure.create({
      data: {
        category: e.category,
        amount: e.amount,
        date,
        description: e.desc,
        recurring: e.category === 'rent' || e.category === 'utilities',
      },
    });
  }

  // Salaries
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  await prisma.salaryRecord.createMany({
    data: [
      { employeeName: 'Saeeda (Senior Crocheter)', amount: 25000, month: monthStart, paidOn: monthStart, status: 'paid' },
      { employeeName: 'Rabia (Crocheter)', amount: 18000, month: monthStart, paidOn: monthStart, status: 'paid' },
      { employeeName: 'Hina (Helper)', amount: 12000, month: monthStart, status: 'pending' },
    ],
  });

  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });