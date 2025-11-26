import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { rateLimiters } from "@/lib/rate-limit";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  // Apply rate limiting
  const rateLimitResult = rateLimiters.auth({
    ip: req.headers['x-forwarded-for'] as string || req.headers['x-real-ip'] as string || 'unknown',
    headers: {
      get: (key: string) => req.headers[key.toLowerCase()] as string | null
    }
  } as any);

  // Set rate limit headers
  Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (!rateLimitResult.success) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  try {
    const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
    if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({ data: { name, email, passwordHash, role: "CUSTOMER" } });

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

