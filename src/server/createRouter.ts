import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";
import type { Session } from "next-auth";

const t = initTRPC.context<Context>().create();

export const createRouter = t.router;
export const publicProcedure = t.procedure;
export const mergeRouters = t.mergeRouters;
export type RouterFactory = typeof createRouter;

// Define a type for the protected context where session is guaranteed to exist
type ProtectedContext = Omit<Context, "session"> & {
    session: NonNullable<Context["session"]> & {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role?: string;
            phone?: string | null;
            address?: string | null;
            shippingInfo?: string | null;
        };
    };
};

// Enforce auth for protected routes
const isAuthed = t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    // Type assertion is safe here because we've checked that session and user exist
    return next({
        ctx: ctx as ProtectedContext
    });
});

export const protectedProcedure = t.procedure.use(isAuthed);