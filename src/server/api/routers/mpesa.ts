import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, protectedProcedure } from "@/server/createRouter";
import {
  buildTimestamp,
  fetchAccessToken,
  getRequiredEnv,
  mpesaBaseUrl,
  normalizePhoneNumber,
} from "@/server/mpesa/utils";

const stkPushSuccessResponseSchema = z
  .object({
    MerchantRequestID: z.string(),
    CheckoutRequestID: z.string(),
    ResponseCode: z.string(),
    ResponseDescription: z.string(),
    CustomerMessage: z.string(),
  })
  .passthrough();

const stkPushErrorResponseSchema = z
  .object({
    errorCode: z.string(),
    errorMessage: z.string(),
  })
  .passthrough();

const transactionStatusSchema = z.object({
  resultCode: z.number().nullable(),
  resultDesc: z.string().nullable(),
  mpesaReceiptNumber: z.string().nullable(),
  orderStatus: z.string().nullable(),
});

export const mpesaRouter = createRouter({
  getAccessToken: protectedProcedure.query(async () => {
    const token = await fetchAccessToken();
    return token;
  }),
  initiatePayment: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        phoneNumber: z.string().min(9).max(15),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { amount, phoneNumber } = input;
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const businessShortCode = getRequiredEnv("MPESA_SHORTCODE");
      const passkey = getRequiredEnv("MPESA_PASSKEY");
      const callbackUrl = getRequiredEnv("MPESA_CALLBACK_URL");

      const cart = await ctx.prisma.cart.findUnique({
        where: { userId: ctx.session.user.id },
        include: { items: { include: { product: true } } },
      });

      if (!cart || cart.items.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cart is empty" });
      }

      const itemsData = cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product?.price ?? 0,
      }));

      const totalAmount = itemsData.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      const amountToCharge = Number(totalAmount.toFixed(2));
      if (Math.abs(amountToCharge - amount) > 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Checkout total mismatch. Please refresh your cart and try again.",
        });
      }

      const { order } = await ctx.prisma.$transaction(async (tx) => {
        const createdOrder = await tx.order.create({
          data: {
            userId: ctx.session.user.id,
            status: "PENDING",
            total: amountToCharge,
            items: {
              create: itemsData.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
          include: { items: true },
        });

        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

        return { order: createdOrder };
      });

      const { accessToken } = await fetchAccessToken();
      const timestamp = buildTimestamp();
      const password = Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString(
        "base64",
      );

      console.info(
        `[${new Date().toISOString()}] Initiating STK push for order ${order.id} on behalf of user ${
          ctx.session?.user?.id ?? "unknown"
        }`,
      );

      const stkPayload = {
        BusinessShortCode: businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amountToCharge,
        PartyA: normalizedPhone,
        PartyB: businessShortCode,
        PhoneNumber: normalizedPhone,
        CallBackURL: callbackUrl,
        AccountReference: order.id,
        TransactionDesc: "Order Payment",
      };

      // DEBUG LOG – shows EXACTLY what goes to Daraja
      console.log("[STK PUSH] Request body →", {
        ...stkPayload,
        Password: "*****",   // never log the real password
      });

      const response = await fetch(`${mpesaBaseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stkPayload),
      });

      const responseBody = (await response.json()) as unknown;

      if (!response.ok) {
        const parsedError = stkPushErrorResponseSchema.safeParse(responseBody);
        const message = parsedError.success
          ? parsedError.data.errorMessage
          : "Failed to initiate M-PESA STK push request.";
        console.error(
          `[${new Date().toISOString()}] STK push error response:`,
          parsedError.success ? parsedError.data : responseBody,
        );

        await ctx.prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });

        throw new TRPCError({ code: "BAD_REQUEST", message });
      }

      const parsedSuccess = stkPushSuccessResponseSchema.safeParse(responseBody);
      if (!parsedSuccess.success) {
        const parsedError = stkPushErrorResponseSchema.safeParse(responseBody);
        if (parsedError.success) {
          await ctx.prisma.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED" },
          });

          throw new TRPCError({
            code: "BAD_REQUEST",
            message: parsedError.data.errorMessage,
          });
        }

        console.error(
          `[${new Date().toISOString()}] Unexpected STK push response body:`,
          responseBody,
        );
        await ctx.prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Received unexpected response from M-PESA STK push endpoint.",
        });
      }

      await ctx.prisma.transaction.create({
        data: {
          merchantRequestId: parsedSuccess.data.MerchantRequestID,
          checkoutRequestId: parsedSuccess.data.CheckoutRequestID,
          resultCode: null,
          resultDesc: "Awaiting customer confirmation",
          amount: amountToCharge,
          phoneNumber: normalizedPhone,
          transactionDate: timestamp,
          orderId: order.id,
        },
      });

      return {
        ...parsedSuccess.data,
        orderId: order.id,
      };
    }),
  getTransactionStatus: protectedProcedure
    .input(
      z.object({
        checkoutRequestId: z.string().min(5),
      }),
    )
    .query(async ({ ctx, input }) => {
      const transaction = await ctx.prisma.transaction.findUnique({
        where: { checkoutRequestId: input.checkoutRequestId },
        include: {
          order: {
            select: { status: true },
          },
        },
      });

      if (!transaction) {
        return transactionStatusSchema.parse({
          resultCode: null,
          resultDesc: null,
          mpesaReceiptNumber: null,
          orderStatus: null,
        });
      }

      return transactionStatusSchema.parse({
        resultCode: transaction.resultCode ?? null,
        resultDesc: transaction.resultDesc ?? null,
        mpesaReceiptNumber: transaction.mpesaReceiptNumber ?? null,
        orderStatus: transaction.order?.status ?? null,
      });
    }),
});

