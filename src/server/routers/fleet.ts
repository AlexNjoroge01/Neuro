import { z } from "zod";
import { createRouter, protectedProcedure } from "../createRouter";

export const fleetRouter = createRouter({
  addVehicle: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        type: z.string().min(1),
        plateNumber: z.string().min(1),
        mileage: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.vehicle.create({ data: input });
    }),

  logTrip: protectedProcedure
    .input(
      z.object({
        vehicleId: z.string(),
        route: z.string().min(1),
        date: z.date().optional(),
        purpose: z.string().min(1),
        fuelUsed: z.number().optional(),
        driverName: z.string().optional(),
        cost: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { date, ...rest } = input;
      return ctx.prisma.trip.create({ data: { ...rest, date: date ?? new Date() } });
    }),

  getVehicles: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.vehicle.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" }, include: { Trip: { where: { deletedAt: null } } } });
  }),
  deleteVehicle: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.vehicle.update({ where: { id: input }, data: { deletedAt: new Date() } });
  }),
  restoreVehicle: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.vehicle.update({ where: { id: input }, data: { deletedAt: null } });
  }),
});


