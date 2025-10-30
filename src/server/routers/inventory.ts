import { z } from "zod";
import { createRouter, protectedProcedure } from "../createRouter";

export const inventoryRouter = createRouter({
    adjust: protectedProcedure
        .input(
            z.object({
                productId: z.string(),
                type: z.enum(["ADD", "REMOVE"]),
                amount: z.number().int().positive(),
                reason: z.string().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { productId, type, amount, reason } = input;
            const product = await ctx.prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
            if (!product) {
                throw new Error("Product not found or archived");
            }

            if (type === "REMOVE" && product.stock < amount) {
                throw new Error("Insufficient stock");
            }

            const updated = await ctx.prisma.product.update({
                where: { id: productId },
                data: { stock: { increment: type === "ADD" ? amount : -amount } },
            });
            await ctx.prisma.inventoryLog.create({ data: { productId, change: amount, type, reason } });
            return updated;
        }),
    logs: protectedProcedure.input(z.object({ productId: z.string().optional() }).optional()).query(async ({ ctx, input }) => {
        return ctx.prisma.inventoryLog.findMany({
            where: input?.productId ? { productId: input.productId, deletedAt: null } : { deletedAt: null },
            orderBy: { createdAt: "desc" },
        });
    }),
});