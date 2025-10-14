import { createRouter, protectedProcedure } from "../createRouter";

export const dashboardRouter = createRouter({
    overview: protectedProcedure.query(async ({ ctx }) => {
        const [incomeAgg, expensesAgg, stockAgg, tripsCount, fuelUsedAgg] = await Promise.all([
            ctx.prisma.sale.aggregate({ _sum: { totalPrice: true } }),
            ctx.prisma.expense.aggregate({ _sum: { amount: true } }),
            ctx.prisma.product.aggregate({ _sum: { stock: true } }),
            ctx.prisma.trip.count(),
            ctx.prisma.trip.aggregate({ _sum: { fuelUsed: true } }),
        ]);

        const totalIncome = incomeAgg._sum.totalPrice ?? 0;
        const totalExpenses = expensesAgg._sum.amount ?? 0;
        const netProfit = totalIncome - totalExpenses;
        const stockCount = stockAgg._sum.stock ?? 0;
        const vehicleStats = {
            trips: tripsCount,
            fuelUsed: fuelUsedAgg._sum.fuelUsed ?? 0,
        };

        return { totalIncome, totalExpenses, netProfit, stockCount, vehicleStats };
    }),
    recentSales: protectedProcedure.query(async ({ ctx }) => {
        return ctx.prisma.sale.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { product: true } });
    }),
});