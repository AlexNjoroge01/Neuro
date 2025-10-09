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
        include: { product: true, customer: true },
      });
    }),
  create: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        customerId: z.string().optional(),
        quantity: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findUnique({ where: { id: input.productId } });
      if (!product) {
        throw new Error("Product not found");
      }
      if (product.stock < input.quantity) {
        throw new Error("Insufficient stock");
      }

      const totalPrice = product.price * input.quantity;

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
            customerId: input.customerId,
            quantity: input.quantity,
            totalPrice,
          },
        });

        return { sale, product: updated };
      });

      return result;
    }),
});


