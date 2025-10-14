import { z } from "zod";
import { createRouter, protectedProcedure } from "../createRouter";

export const hrRouter = createRouter({
  addEmployee: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        role: z.string().min(1),
        salary: z.number().nonnegative(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.employee.create({ data: input });
    }),

  recordPayroll: protectedProcedure
    .input(
      z.object({
        employeeId: z.string(),
        month: z.string().min(1),
        amountPaid: z.number().nonnegative(),
        paidAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { paidAt, ...rest } = input;
      return ctx.prisma.payroll.create({ data: { ...rest, paidAt: paidAt ?? new Date() } });
    }),

  getEmployees: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.employee.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, include: { Payroll: { where: { deletedAt: null } } } });
  }),
  deleteEmployee: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.employee.update({ where: { id: input }, data: { deletedAt: new Date() } });
  }),
  restoreEmployee: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.employee.update({ where: { id: input }, data: { deletedAt: null } });
  }),
});


