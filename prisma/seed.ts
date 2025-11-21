import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Seed superuser
    const superuserEmail = 'alexnjoroge102@gmail.com';
    const superuserPassword = 'Password@123';
    const superuserName = 'Alex Njoroge';
    const passwordHash = await bcrypt.hash(superuserPassword, 10);

    const existingSuperuser = await prisma.user.findUnique({
        where: { email: superuserEmail }
    });

    if (existingSuperuser) {
        await prisma.user.update({
            where: { email: superuserEmail },
            data: {
                passwordHash,
                role: 'SUPERUSER',
                name: superuserName
            }
        });
        console.log('✅ Existing superuser updated:', superuserEmail);
    } else {
        await prisma.user.create({
            data: {
                email: superuserEmail,
                passwordHash,
                name: superuserName,
                role: 'SUPERUSER'
            }
        });
        console.log('✅ New superuser created:', superuserEmail);
    }

    console.log('🎉 Database seeding completed!');
}

main()
    .catch((err) => {
        console.error('❌ Error during seeding:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
