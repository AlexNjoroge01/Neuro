import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth/options';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (session?.user?.role !== 'SUPERUSER') return res.status(403).json({ error: 'Forbidden' });

  if (req.method === 'GET') {
    // Return all admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, email: true } });
    return res.status(200).json(admins);
  }
  if (req.method === 'POST') {
    const { email, password } = JSON.parse(req.body);
    if (!email || !password) return res.status(400).json({ error: 'Missing' });
    let user = await prisma.user.findUnique({ where: { email } });
    const hash = await bcrypt.hash(password, 10);
    if (user) {
      user = await prisma.user.update({ where: { email }, data: { passwordHash: hash, role: 'ADMIN' } });
    } else {
      user = await prisma.user.create({ data: { email, passwordHash: hash, role: 'ADMIN' } });
    }
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, email: true } });
    return res.status(200).json(admins);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
