import { PrismaClient } from "@prisma/client";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/options";
import type { Session } from "next-auth";

let prismaGlobal: PrismaClient | undefined;

function getPrismaClient(): PrismaClient {
    if (!prismaGlobal) {
        prismaGlobal = new PrismaClient();
    }
    return prismaGlobal;
}

export type Context = {
    prisma: PrismaClient;
    req: CreateNextContextOptions["req"];
    res: CreateNextContextOptions["res"];
    session: Session | null;
};

export async function createContext(opts: CreateNextContextOptions): Promise<Context> {
    const session = await getServerSession(opts.req, opts.res, authOptions);
    return {
        prisma: getPrismaClient(),
        req: opts.req,
        res: opts.res,
        session,
    };
}