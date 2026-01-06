import { z } from "zod";
import { createRouter, publicProcedure, protectedProcedure } from "../createRouter";

export const productsRouter = createRouter({
    list: protectedProcedure.query(async ({ ctx }) => {
        return ctx.prisma.product.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            include: { variations: true }
        });
    }),
    get: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
        return ctx.prisma.product.findFirst({
            where: { id: input, deletedAt: null },
            include: { variations: true }
        });
    }),
    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1),
                unit: z.string().min(1),
                size: z.string().optional(),
                price: z.number().nonnegative(),
                costPrice: z.number().nonnegative().default(0),
                stock: z.number().int(),
                image: z.string().optional(),
                category: z.string().optional(),
                brand: z.string().optional(),
                variations: z.array(z.object({
                    name: z.string(),
                    image: z.string().optional(),
                })).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { variations, ...productData } = input;
            return ctx.prisma.product.create({
                data: {
                    ...productData,
                    variations: variations ? {
                        create: variations
                    } : undefined
                },
                include: { variations: true }
            });
        }),
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1).optional(),
                unit: z.string().min(1).optional(),
                size: z.string().optional(),
                price: z.number().nonnegative().optional(),
                costPrice: z.number().nonnegative().optional(),
                stock: z.number().int().optional(),
                image: z.string().optional(),
                category: z.string().optional(),
                brand: z.string().optional(),
                variations: z.array(z.object({
                    id: z.string().optional(),
                    name: z.string(),
                    image: z.string().optional(),
                })).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, variations, ...data } = input;
            
            // Handle variations if provided
            if (variations !== undefined) {
                const existingIds = variations.filter(v => v.id).map(v => v.id!);
                
                // Delete variations not in the new list
                await ctx.prisma.productVariation.deleteMany({
                    where: {
                        productId: id,
                        id: { notIn: existingIds }
                    }
                });
                
                // Update existing and create new variations
                for (const v of variations) {
                    if (v.id) {
                        await ctx.prisma.productVariation.update({
                            where: { id: v.id },
                            data: { name: v.name, image: v.image }
                        });
                    } else {
                        await ctx.prisma.productVariation.create({
                            data: {
                                productId: id,
                                name: v.name,
                                image: v.image
                            }
                        });
                    }
                }
            }
            
            return ctx.prisma.product.update({
                where: { id },
                data,
                include: { variations: true }
            });
        }),
    delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
        return ctx.prisma.product.update({ where: { id: input }, data: { deletedAt: new Date() } });
    }),
    restore: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
        return ctx.prisma.product.update({ where: { id: input }, data: { deletedAt: null } });
    }),
    publicList: publicProcedure.query(async ({ ctx }) => {
        // Only expose public fields (base, omit those that cause Prisma select errors for now)
        return ctx.prisma.product.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            include: { variations: true }
        });
    }),
    publicGet: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
        return ctx.prisma.product.findFirst({
            where: { id: input, deletedAt: null },
            include: { variations: true }
        });
    }),
    search: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
        const q = input.trim();
        if (!q) return [];
        return ctx.prisma.product.findMany({
            where: {
                deletedAt: null,
                OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { category: { contains: q, mode: "insensitive" } },
                    { brand: { contains: q, mode: "insensitive" } },
                ],
            },
            orderBy: { createdAt: "desc" },
            take: 10,
        });
    }),
}); 