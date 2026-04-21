import { PrismaClient } from '@prisma/client';
import { CONFIG_CATALOG } from '../src/contracts/config-catalog.js';
import { hashPassword } from '../src/utils/password.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding config catalog...');

  for (const [key, entry] of Object.entries(CONFIG_CATALOG)) {
    const existing = await prisma.config.findUnique({ where: { key } });
    if (!existing) {
      let value: unknown;
      if (entry.type === 'Decimal') {
        value = (entry.default as { toString(): string }).toString();
      } else {
        value = entry.default;
      }

      await prisma.config.create({
        data: {
          key,
          value: value as never,
          description: entry.description,
        },
      });
      console.log(`  ✅ ${key}`);
    }
  }

  console.log('🌱 Seeding admin user...');
  const adminEmail = 'admin@tradeverse.app';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await hashPassword('AdminPass123!'),
        name: 'System Admin',
        displayName: 'Admin',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        kycStatus: 'VERIFIED',
        referralCode: 'ADMIN001',
      },
    });
    console.log('  ✅ Admin user created (admin@tradeverse.app / AdminPass123!)');
  }

  console.log('🌱 Seeding test user...');
  const testEmail = 'user@tradeverse.app';
  const existingUser = await prisma.user.findUnique({ where: { email: testEmail } });
  if (!existingUser) {
    await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: await hashPassword('UserPass123!'),
        name: 'Test User',
        displayName: 'TraderOne',
        role: 'TRADER',
        status: 'ACTIVE',
        kycStatus: 'VERIFIED',
        referralCode: 'TRADER01',
      },
    });
    console.log('  ✅ Test user created (user@tradeverse.app / UserPass123!)');
  }

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
