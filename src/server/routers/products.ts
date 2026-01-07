import { z } from "zod";
import {
  createRouter,
  publicProcedure,
  protectedProcedure,
} from "../createRouter";

export const productsRouter = createRouter({
  // List all products with variations
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        variations: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }),

  // Get single product with variations
  get: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.prisma.product.findFirst({
      where: { id: input, deletedAt: null },
      include: {
        variations: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }),

  // Create product with optional variations
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Product name is required"),
        unit: z.string().min(1, "Unit is required"),
        size: z.string().optional(),
        price: z.number().nonnegative("Price must be non-negative"),
        costPrice: z
          .number()
          .nonnegative("Cost price must be non-negative")
          .default(0),
        stock: z.number().int("Stock must be a whole number"),
        image: z.string().optional(),
        category: z.string().optional(),
        brand: z.string().optional(),
        variations: z
          .array(
            z.object({
              name: z.string().min(1, "Variation name is required"),
              image: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { variations, ...productData } = input;

      return ctx.prisma.product.create({
        data: {
          ...productData,
          variations:
            variations && variations.length > 0
              ? {
                  create: variations,
                }
              : undefined,
        },
        include: {
          variations: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }),

  // 🔥 IMPROVED UPDATE WITH PROPER TRANSACTION HANDLING
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Product name is required").optional(),
        unit: z.string().min(1, "Unit is required").optional(),
        size: z.string().optional(),
        price: z.number().nonnegative("Price must be non-negative").optional(),
        costPrice: z
          .number()
          .nonnegative("Cost price must be non-negative")
          .optional(),
        stock: z.number().int("Stock must be a whole number").optional(),
        image: z.string().optional(),
        category: z.string().optional(),
        brand: z.string().optional(),
        variations: z
          .array(
            z.object({
              id: z.string().optional(),
              name: z.string().min(1, "Variation name is required"),
              image: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, variations, ...productData } = input;

      console.log("=== UPDATE PRODUCT START ===");
      console.log("Product ID:", id);
      console.log("Product Data:", productData);
      console.log("Variations:", JSON.stringify(variations, null, 2));

      // Use Prisma transaction to ensure all operations succeed or fail together
      return ctx.prisma.$transaction(async (tx) => {
        // Step 1: Update product data if provided
        if (Object.keys(productData).length > 0) {
          await tx.product.update({
            where: { id },
            data: productData,
          });
          console.log("✅ Product data updated");
        }

        // Step 2: Handle variations if provided
        if (variations !== undefined) {
          console.log("📝 Processing variations...");

          // Get current variations from DB
          const currentVariations = await tx.productVariation.findMany({
            where: { productId: id },
          });
          console.log("Current variations in DB:", currentVariations.length);

          const incomingVariationIds = variations
            .filter((v) => v.id)
            .map((v) => v.id!);
          console.log("Incoming variation IDs:", incomingVariationIds);

          // Step 2a: Delete variations that are no longer in the list
          const variationsToDelete = currentVariations.filter(
            (v) => !incomingVariationIds.includes(v.id),
          );

          if (variationsToDelete.length > 0) {
            const deleteResult = await tx.productVariation.deleteMany({
              where: {
                id: { in: variationsToDelete.map((v) => v.id) },
              },
            });
            console.log(`🗑️  Deleted ${deleteResult.count} variations`);
          }

          // Step 2b: Update existing variations and create new ones
          for (const variation of variations) {
            if (variation.id) {
              // Update existing variation
              const updateResult = await tx.productVariation.update({
                where: { id: variation.id },
                data: {
                  name: variation.name,
                  image: variation.image,
                },
              });
              console.log(`✏️  Updated variation: ${updateResult.id}`);
            } else {
              // Create new variation
              const createResult = await tx.productVariation.create({
                data: {
                  productId: id,
                  name: variation.name,
                  image: variation.image,
                },
              });
              console.log(`➕ Created variation: ${createResult.id}`);
            }
          }
        }

        // Step 3: Fetch and return the updated product with all variations
        const updatedProduct = await tx.product.findUnique({
          where: { id },
          include: {
            variations: {
              orderBy: { createdAt: "asc" },
            },
          },
        });

        console.log("=== UPDATE COMPLETE ===");
        console.log(
          "Final variations count:",
          updatedProduct?.variations.length,
        );

        return updatedProduct;
      });
    }),

  // Soft delete product
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.product.update({
        where: { id: input },
        data: { deletedAt: new Date() },
        include: { variations: true },
      });
    }),

  // Restore soft-deleted product
  restore: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.product.update({
        where: { id: input },
        data: { deletedAt: null },
        include: { variations: true },
      });
    }),

  // Public endpoint: List all products
  publicList: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        variations: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }),

  // Public endpoint: Get single product
  publicGet: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.prisma.product.findFirst({
      where: { id: input, deletedAt: null },
      include: {
        variations: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }),

  // Public endpoint: Search products
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
      include: {
        variations: {
          orderBy: { createdAt: "asc" },
        },
      },
      take: 10,
    });
  }),

  // Variation-specific operations

  // Add variation to existing product
  addVariation: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        name: z.string().min(1, "Variation name is required"),
        image: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.productVariation.create({
        data: input,
      });
    }),

  // Update a specific variation
  updateVariation: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Variation name is required").optional(),
        image: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.productVariation.update({
        where: { id },
        data,
      });
    }),

  // Delete a specific variation
  deleteVariation: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.productVariation.delete({
        where: { id: input },
      });
    }),

  // Get all variations for a product
  getVariations: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.productVariation.findMany({
        where: { productId: input },
        orderBy: { createdAt: "asc" },
      });
    }),
});

