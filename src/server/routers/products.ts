import { z } from "zod";
import { createRouter, publicProcedure, protectedProcedure } from "../createRouter";

export const productsRouter = createRouter({
    list: protectedProcedure.query(async ({ ctx }) => {
		return ctx.prisma.product.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } });
	}),
    get: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
		return ctx.prisma.product.findFirst({ where: { id: input, deletedAt: null } });
	}),
    create: protectedProcedure
		.input(
            z.object({
                name: z.string().min(1),
                unit: z.string().min(1),
                size: z.string().optional(),
                price: z.number().nonnegative(),
                costPrice: z.number().nonnegative().default(0),
                stock: z.number().int(),
            })
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.product.create({ data: input });
		}),
    update: protectedProcedure
		.input(
            z.object({
                id: z.string(),
                name: z.string().min(1).optional(),
                unit: z.string().min(1).optional(),
                size: z.string().optional(),
                price: z.number().nonnegative().optional(),
                costPrice: z.number().nonnegative().optional(),
                stock: z.number().int().optional(),
            })
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.prisma.product.update({ where: { id }, data });
		}),
    delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		return ctx.prisma.product.update({ where: { id: input }, data: { deletedAt: new Date() } });
	}),
    restore: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		return ctx.prisma.product.update({ where: { id: input }, data: { deletedAt: null } });
	}),
}); 