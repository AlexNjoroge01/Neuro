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
        return { id: user.id, name: user.name ?? null, email: user.email ?? null } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On first sign in, persist the user id to the token
      if (user) {
        // @ts-expect-error add id to token
        token.id = (user as any).id ?? token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        // @ts-expect-error id from token
        session.user.id = (token as any).id ?? token.sub ?? session.user.id;
      }
      return session;
    },
    async signIn() {
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;

