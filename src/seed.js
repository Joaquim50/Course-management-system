const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@lms.local',
      password: 'admin',
      role: 'ADMIN'
    }
  });
  console.log('Admin user created');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
