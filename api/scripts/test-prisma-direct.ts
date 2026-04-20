import { PrismaClient } from '@prisma/client';

const p = new PrismaClient({
  datasources: {
    db: {
      url: 'postgres://tradeverse:tradeverse@localhost:5433/tradeverse',
    },
  },
  log: ['query', 'info', 'warn', 'error'],
});

async function run() {
  try {
    await p.$connect();
    console.log('Connected');
    const users = await p.user.findMany();
    console.log('Users:', users);
    await p.$disconnect();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
