import { prisma } from '../src/config/prisma.js';

async function run() {
  const users = await prisma.user.findMany();
  console.log('users:', JSON.stringify(users));
  if (Array.isArray(users)) {
    console.log('A5 PASS: prisma.user.findMany() returns array');
  } else {
    console.error('A5 FAIL: did not return array');
    process.exit(1);
  }
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
