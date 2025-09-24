import { z } from "zod";
import { createRouter, publicProcedure } from "../createRouter";

export const customersRouter = createRouter({
	list: publicProcedure.query(async ({ ctx }) => {
		return ctx.prisma.customer.findMany({ orderBy: { createdAt: "desc" } });
	}),
	get: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
		return ctx.prisma.customer.findUnique({ where: { id: input } });
	}),
	create: publicProcedure
		.input(
			z.object({
				name: z.string().min(1),
				email: z.string().email(),
				phone: z.string().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => ctx.prisma.customer.create({ data: input })),
	update: publicProcedure
		.input(
			z.object({
				id: z.string(),
				name: z.string().min(1).optional(),
				email: z.string().email().optional(),
				phone: z.string().optional(),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { id, ...data } = input;
			return ctx.prisma.customer.update({ where: { id }, data });
		}),
	delete: publicProcedure.input(z.string()).mutation(async ({ ctx, input }) => ctx.prisma.customer.delete({ where: { id: input } })),
}); 