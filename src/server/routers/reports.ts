import { z } from "zod";
import { createRouter, protectedProcedure } from "../createRouter";

export const reportsRouter = createRouter({
    stats: protectedProcedure
		.input(
			z.object({
				from: z.string().datetime().optional(),
				to: z.string().datetime().optional(),
			})
			.optional()
		)
		.query(async ({ ctx, input }) => {
			const where = input?.from || input?.to ? {
				createdAt: {
					gte: input?.from ? new Date(input.from) : undefined,
					lte: input?.to ? new Date(input.to) : undefined,
				},
			} : undefined;

			const [totalRevenue, totalSales, customersCount, topProducts] = await Promise.all([
				ctx.prisma.sale.aggregate({ _sum: { totalPrice: true }, where }),
				ctx.prisma.sale.count({ where }),
				ctx.prisma.customer.count(),
				ctx.prisma.sale.groupBy({ by: ["productId"], _sum: { quantity: true, totalPrice: true }, orderBy: { _sum: { totalPrice: "desc" } }, take: 5 }),
			]);

			return {
				totalRevenue: totalRevenue._sum.totalPrice ?? 0,
				totalSales,
				customersCount,
				topProducts,
			};
		}),
}); 