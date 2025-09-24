import { z } from "zod";
import { createRouter, publicProcedure } from "../createRouter";

export const inventoryRouter = createRouter({
	adjust: publicProcedure
		.input(
			z.object({
				productId: z.string(),
				change: z.number().int(),
				reason: z.string().min(1),
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { productId, change, reason } = input;
			const updated = await ctx.prisma.product.update({
				where: { id: productId },
				data: { stock: { increment: change } },
			});
			await ctx.prisma.inventoryLog.create({ data: { productId, change, reason } });
			return updated;
		}),
	logs: publicProcedure.input(z.object({ productId: z.string().optional() }).optional()).query(async ({ ctx, input }) => {
		return ctx.prisma.inventoryLog.findMany({
			where: input?.productId ? { productId: input.productId } : undefined,
			orderBy: { createdAt: "desc" },
		});
	}),
}); 