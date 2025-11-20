import { createRouter, protectedProcedure } from "../createRouter";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const notificationsRouter = createRouter({
    list: protectedProcedure.query(async ({ ctx }) => {
        // Only admins and superusers can see notifications
        if (ctx.session.user.role !== "ADMIN" && ctx.session.user.role !== "SUPERUSER") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        return ctx.prisma.notification.findMany({
            where: { userId: ctx.session.user.id },
            include: {
                order: {
                    include: {
                        user: true,
                        items: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 50, // Limit to 50 most recent notifications
        });
    }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
        // Only admins and superusers can see notifications
        if (ctx.session.user.role !== "ADMIN" && ctx.session.user.role !== "SUPERUSER") {
            return 0;
        }

        return ctx.prisma.notification.count({
            where: {
                userId: ctx.session.user.id,
                read: false,
            },
        });
    }),

    markAsRead: protectedProcedure
        .input(z.object({ notificationId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // Only admins and superusers can mark notifications
            if (ctx.session.user.role !== "ADMIN" && ctx.session.user.role !== "SUPERUSER") {
                throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
            }

            return ctx.prisma.notification.update({
                where: {
                    id: input.notificationId,
                    userId: ctx.session.user.id, // Ensure user can only mark their own notifications
                },
                data: { read: true },
            });
        }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
        // Only admins and superusers can mark notifications
        if (ctx.session.user.role !== "ADMIN" && ctx.session.user.role !== "SUPERUSER") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        return ctx.prisma.notification.updateMany({
            where: {
                userId: ctx.session.user.id,
                read: false,
            },
            data: { read: true },
        });
    }),
});
