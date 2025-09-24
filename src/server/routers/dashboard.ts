import { createRouter, publicProcedure } from "../createRouter";

export const dashboardRouter = createRouter({
	overview: publicProcedure.query(async ({ ctx }) => {
		const [totalRevenueAgg, totalSales, totalUsers, totalTransactions] = await Promise.all([
			ctx.prisma.sale.aggregate({ _sum: { totalPrice: true } }),
			ctx.prisma.sale.count(),
			ctx.prisma.customer.count(),
			ctx.prisma.sale.count(),
		]);

		return {
			totalIncome: totalRevenueAgg._sum.totalPrice ?? 0,
			totalSales,
			totalUsers,
			totalTransactions,
		};
	}),
	recentSales: publicProcedure.query(async ({ ctx }) => {
		return ctx.prisma.sale.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { product: true, customer: true } });
	}),
}); 