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
    .input(z.object({ limit: z.number().int().positive().max(200).default(50), includeArchived: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const take = input?.limit ?? 50;
      const includeArchived = input?.includeArchived ?? false;
      return ctx.prisma.expense.findMany({ where: includeArchived ? undefined : { deletedAt: null }, orderBy: { createdAt: "desc" }, take });
    }),

  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const [incomeAgg, expensesAgg] = await Promise.all([
      ctx.prisma.sale.aggregate({ _sum: { totalPrice: true }, where: { deletedAt: null } }),
      ctx.prisma.expense.aggregate({ _sum: { amount: true }, where: { deletedAt: null } }),
    ]);
    const totalIncome = incomeAgg._sum.totalPrice ?? 0;
    const totalExpenses = expensesAgg._sum.amount ?? 0;
    const netIncome = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, netIncome };
  }),
  deleteExpense: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.expense.update({ where: { id: input }, data: { deletedAt: new Date() } });
  }),
  restoreExpense: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.expense.update({ where: { id: input }, data: { deletedAt: null } });
  }),
});


