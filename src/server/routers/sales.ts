import { z } from "zod";
import { createRouter, protectedProcedure } from "../createRouter";

export const salesRouter = createRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().positive().max(100).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const take = input?.limit ?? 20;
      return ctx.prisma.sale.findMany({
        orderBy: { createdAt: "desc" },
        take,
        include: { product: true },
        where: { deletedAt: null },
      });
    }),
  create: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        paymentMethod: z.enum(["CASH", "MPESA"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findFirst({ where: { id: input.productId, deletedAt: null } });
      if (!product) {
        throw new Error("Product not found or archived");
      }
      if (product.stock < input.quantity) {
        throw new Error("Insufficient stock");
      }

      const totalPrice = product.price * input.quantity;
      const profit = (product.price - (product.costPrice ?? 0)) * input.quantity;

      const result = await ctx.prisma.$transaction(async (tx) => {
        const updated = await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: input.quantity } },
        });

        await tx.inventoryLog.create({
          data: {
            productId: product.id,
            change: -input.quantity,
            reason: "Sale",
          },
        });

        const sale = await tx.sale.create({
          data: {
            productId: product.id,
            quantity: input.quantity,
            totalPrice,
            profit,
            paymentMethod: input.paymentMethod,
          },
        });

        return { sale, product: updated };
      });

      return result;
    }),
  delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.sale.update({ where: { id: input }, data: { deletedAt: new Date() } });
  }),
  restore: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.sale.update({ where: { id: input }, data: { deletedAt: null } });
  }),
});


