import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test data...');

  await prisma.user.deleteMany({ where: { email: { in: ['test@example.com', 'admin@example.com'] } } });

  await prisma.user.create({
    data: {
      email: 'test@example.com',
      passwordHash: await hashPassword('TestPass123!'),
      name: 'Test User',
      displayName: 'TestUser',
      role: 'USER',
      status: 'ACTIVE',
      kycStatus: 'NOT_STARTED',
      referralCode: 'TEST001',
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: await hashPassword('AdminPass123!'),
      name: 'Admin User',
      displayName: 'AdminUser',
      role: 'ADMIN',
      status: 'ACTIVE',
      kycStatus: 'VERIFIED',
      referralCode: 'ADMIN001',
    },
  });

  console.log('✅ Test seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
