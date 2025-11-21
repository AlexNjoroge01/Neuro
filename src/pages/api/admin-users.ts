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
    // Return all active admins (not soft deleted)
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', deletedAt: null },
      select: { id: true, email: true }
    });
    return res.status(200).json(admins);
  }

  if (req.method === 'POST') {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    let user = await prisma.user.findUnique({ where: { email } });
    const hash = await bcrypt.hash(password, 10);

    if (user) {
      user = await prisma.user.update({
        where: { email },
        data: { passwordHash: hash, role: 'ADMIN', deletedAt: null }
      });
    } else {
      user = await prisma.user.create({
        data: { email, passwordHash: hash, role: 'ADMIN' }
      });
    }

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', deletedAt: null },
      select: { id: true, email: true }
    });
    return res.status(200).json(admins);
  }

  if (req.method === 'PUT') {
    const { id, email, password } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing admin ID' });

    // Prevent editing yourself
    if (id === session.user.id) {
      return res.status(400).json({ error: 'Cannot edit your own account' });
    }

    const updateData: any = {};
    if (email) updateData.email = email;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id },
      data: updateData
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', deletedAt: null },
      select: { id: true, email: true }
    });
    return res.status(200).json(admins);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing admin ID' });

    // Prevent deleting yourself
    if (id === session.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Soft delete: set deletedAt to current timestamp
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', deletedAt: null },
      select: { id: true, email: true }
    });
    return res.status(200).json(admins);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
