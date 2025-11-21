import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'alexnjoroge102@gmail.com';
  const password = 'Password@123';
  const name = 'Alex Njoroge';
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({ where: { email }, data: { passwordHash, role: 'SUPERUSER', name } });
    console.log('Existing user updated to SUPERUSER.');
  } else {
    await prisma.user.create({ data: { email, passwordHash, name, role: 'SUPERUSER' } });
    console.log('New SUPERUSER created!');
  }
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
