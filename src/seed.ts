import prisma from './prisma';
import bcrypt from 'bcrypt';

async function main() {
    const defaultPassword = 'admin';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@lms.local' },
        update: {},
        create: {
            email: 'admin@lms.local',
            name: 'Admin User',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    console.log('Seed successful: ', { admin: admin.email, password: defaultPassword });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
