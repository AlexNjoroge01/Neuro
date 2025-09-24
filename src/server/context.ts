import { PrismaClient } from "@prisma/client";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";

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
};

export async function createContext(opts: CreateNextContextOptions): Promise<Context> {
	return {
		prisma: getPrismaClient(),
		req: opts.req,
		res: opts.res,
	};
} 