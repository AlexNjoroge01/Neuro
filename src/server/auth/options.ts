import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Credentials requires JWT strategy in v4
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.passwordHash) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          role: user.role,
          phone: user.phone,
          address: user.address,
          shippingInfo: user.shippingInfo
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On first sign in, persist the user id
      if (user) {
        token.id = (user as any).id ?? token.sub;
      }

      // Always fetch fresh user data from database to ensure session is up-to-date
      // This prevents stale session data and ensures role/profile changes are reflected immediately
      const userId = (token.id as string) ?? token.sub;
      if (userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            phone: true,
            address: true,
            shippingInfo: true
          }
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.role = dbUser.role;
          token.phone = dbUser.phone;
          token.address = dbUser.address;
          token.shippingInfo = dbUser.shippingInfo;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id as string) ?? token.sub ?? session.user.id;
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.name = (token.name as string) ?? session.user.name;
        session.user.role = (token.role as string) ?? "CUSTOMER";
        session.user.phone = token.phone as string | undefined;
        session.user.address = token.address as string | undefined;
        session.user.shippingInfo = token.shippingInfo as string | undefined;
      }
      return session;
    },
    async signIn() { return true; },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;

