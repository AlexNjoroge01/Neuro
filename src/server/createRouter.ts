import { initTRPC } from "@trpc/server";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create();

export const createRouter = t.router;
export const publicProcedure = t.procedure;
export const mergeRouters = t.mergeRouters;
export type RouterFactory = typeof createRouter; 