import prisma from './prisma';

async function main() {
  await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@lms.local',
      password: 'admin', // In a real app we'd hash this, but I'll stick to the existing pattern
      role: 'ADMIN'
    }
  });
  console.log('Admin user created');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
