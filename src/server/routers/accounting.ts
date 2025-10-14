import { z } from "zod";
import { createRouter, protectedProcedure } from "../createRouter";

export const accountingRouter = createRouter({
  addExpense: protectedProcedure
    .input(
      z.object({
        category: z.string().min(1),
        amount: z.number().nonnegative(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.expense.create({ data: input });
    }),

  getExpenses: protectedProcedure
    .input(z.object({ limit: z.number().int().positive().max(200).default(50) }).optional())
    .query(async ({ ctx, input }) => {
      const take = input?.limit ?? 50;
      return ctx.prisma.expense.findMany({ orderBy: { createdAt: "desc" }, take });
    }),

  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const [incomeAgg, expensesAgg] = await Promise.all([
      ctx.prisma.sale.aggregate({ _sum: { totalPrice: true } }),
      ctx.prisma.expense.aggregate({ _sum: { amount: true } }),
    ]);
    const totalIncome = incomeAgg._sum.totalPrice ?? 0;
    const totalExpenses = expensesAgg._sum.amount ?? 0;
    const netIncome = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, netIncome };
  }),
});


