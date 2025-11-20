import { z } from "zod";
import { createRouter, protectedProcedure } from "../createRouter";

export const userRouter = createRouter({
    updateProfile: protectedProcedure
        .input(
            z.object({
                phone: z.string().optional(),
                address: z.string().optional(),
                shippingInfo: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const updatedUser = await ctx.prisma.user.update({
                where: { id: ctx.session.user.id },
                data: {
                    phone: input.phone,
                    address: input.address,
                    shippingInfo: input.shippingInfo,
                },
            });

            return {
                success: true,
                user: {
                    phone: updatedUser.phone,
                    address: updatedUser.address,
                    shippingInfo: updatedUser.shippingInfo,
                },
            };
        }),
});
