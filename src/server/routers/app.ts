import { mergeRouters, createRouter } from "../createRouter";
import { productsRouter } from "./products";
import { inventoryRouter } from "./inventory";
import { reportsRouter } from "./reports";
import { dashboardRouter } from "./dashboard";
import { salesRouter } from "./sales";
import { accountingRouter } from "./accounting";
import { fleetRouter } from "./fleet";
import { hrRouter } from "./hr";
import { z } from "zod";
import { protectedProcedure } from "../createRouter";
import { Role } from "@prisma/client";
import { mpesaRouter } from "../api/routers/mpesa";
import { userRouter } from "./user";
import { notificationsRouter } from "./notifications";

export const cartRouter = createRouter({
  get: protectedProcedure.query(async ({ ctx }) => {
    // Fetch current user's cart
    return ctx.prisma.cart.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }),
  add: protectedProcedure.input(z.object({
    productId: z.string(),
    delta: z.number().int().default(1),
  })).mutation(async ({ ctx, input }) => {
    const cart = await ctx.prisma.cart.upsert({
      where: { userId: ctx.session.user.id },
      update: {},
      create: { userId: ctx.session.user.id },
    });
    const existing = await ctx.prisma.cartItem.findFirst({ where: { cartId: cart.id, productId: input.productId } });
    if (existing) {
      const newQty = Math.max(1, existing.quantity + input.delta);
      return ctx.prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
    }
    return ctx.prisma.cartItem.create({ data: { cartId: cart.id, productId: input.productId, quantity: Math.max(1, input.delta) } });
  }),
  addOrUpdate: protectedProcedure.input(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1),
  })).mutation(async ({ ctx, input }) => {
    // Upsert pattern: if exists, update. If not, create.
    const cart = await ctx.prisma.cart.upsert({
      where: { userId: ctx.session.user.id },
      update: {},
      create: { userId: ctx.session.user.id },
    });
    const existing = await ctx.prisma.cartItem.findFirst({ where: { cartId: cart.id, productId: input.productId } });
    if (existing) {
      return ctx.prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: input.quantity } });
    }
    return ctx.prisma.cartItem.create({ data: { cartId: cart.id, productId: input.productId, quantity: input.quantity } });
  }),
  remove: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.cartItem.deleteMany({
      where: { cart: { userId: ctx.session.user.id }, productId: input },
    });
  }),
  clear: protectedProcedure.mutation(async ({ ctx }) => {
    const cart = await ctx.prisma.cart.findUnique({ where: { userId: ctx.session.user.id } });
    if (!cart) return;
    await ctx.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  })
});
export const orderRouter = createRouter({
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const cart = await ctx.prisma.cart.findUnique({
      where: { userId: ctx.session.user.id },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

    const itemsData = cart.items.map(ci => ({
      productId: ci.productId,
      quantity: ci.quantity,
      price: ci.product?.price ?? 0,
    }));
    const total = itemsData.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = await ctx.prisma.order.create({
      data: {
        userId: ctx.session.user.id,
        total,
        items: { create: itemsData },
      },
      include: { items: true },
    });

    await ctx.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return order;
  }),
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role === "ADMIN" || ctx.session.user.role === "SUPERUSER") {
      return ctx.prisma.order.findMany({
        include: { items: { include: { product: true } }, user: true, transactions: true },
        orderBy: { createdAt: "desc" },
      });
    }
    // Customer: only their own
    return ctx.prisma.order.findMany({
      where: { userId: ctx.session.user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),
  fulfill: protectedProcedure.input(
    z.object({ orderId: z.string(), status: z.enum(["PAID", "SHIPPED", "COMPLETED"]) })
  ).mutation(async ({ ctx, input }) => {
    if (ctx.session.user.role !== "ADMIN" && ctx.session.user.role !== "SUPERUSER") {
      throw new Error("Unauthorized");
    }
    return ctx.prisma.order.update({ where: { id: input.orderId }, data: { status: input.status } });
  }),
});

export const appRouter = mergeRouters(
  createRouter({}),
  createRouter({ products: productsRouter }),
  createRouter({ inventory: inventoryRouter }),
  createRouter({ reports: reportsRouter }),
  createRouter({ dashboard: dashboardRouter }),
  createRouter({ sales: salesRouter }),
  createRouter({ accounting: accountingRouter }),
  createRouter({ fleet: fleetRouter }),
  createRouter({ hr: hrRouter }),
  createRouter({ mpesa: mpesaRouter }),
  createRouter({ cart: cartRouter }),
  createRouter({ orders: orderRouter }),
  createRouter({ notifications: notificationsRouter }),
  createRouter({ user: userRouter }),
);

export type AppRouter = typeof appRouter; 