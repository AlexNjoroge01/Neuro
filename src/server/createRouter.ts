import { initTRPC } from "@trpc/server";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create();

export const createRouter = t.router;
export const publicProcedure = t.procedure;
export const mergeRouters = t.mergeRouters;
export type RouterFactory = typeof createRouter; 

// Enforce auth for protected routes
const isAuthed = t.middleware(({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user) {
        throw new Error("UNAUTHORIZED");
    }
    return next({ ctx: { session: ctx.session } });
});

export const protectedProcedure = t.procedure.use(isAuthed);