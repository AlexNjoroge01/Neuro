import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function ensureCustomerForUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  if (!user.email) return;
  await prisma.customer.upsert({
    where: { email: user.email },
    update: { name: user.name ?? user.email, userId: user.id },
    create: { email: user.email, name: user.name ?? user.email, userId: user.id },
  });
}

