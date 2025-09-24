import { z } from "zod";
import { createRouter, publicProcedure } from "../createRouter";

export const productsRouter = createRouter({
	list: publicProcedure.query(async ({ ctx }) => {
		return ctx.prisma.product.findMany({ orderBy: { createdAt: "desc" } });
	}),
	get: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
		return ctx.prisma.product.findUnique({ where: { id: input } });
	}),
	create: publicProcedure
		.input(
			z.object({
				name: z.string().min(1),
				price: z.number().nonnegative(),
				stock: z.number().int(),
				category: z.string().min(1),
			})
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.prisma.product.create({ data: input });
		}),
	update: publicProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				price: z.number().nonnegative().optional(),
				stock: z.number().int().optional(),
				category: z.string().min(1).optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.prisma.product.update({ where: { id }, data });
		}),
	delete: publicProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
		return ctx.prisma.product.delete({ where: { id: input } });
	}),
}); 