import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const callbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z
        .object({
          Item: z.array(
            z.object({
              Name: z.string(),
              Value: z.union([z.string(), z.number()]).optional(),
            }),
          ),
        })
        .optional(),
    }),
  }),
});

type CallbackPayload = z.infer<typeof callbackSchema>;
type CallbackItem = NonNullable<
  CallbackPayload["Body"]["stkCallback"]["CallbackMetadata"]
>["Item"][number];

const prismaClientSingleton = (): PrismaClient => {
  return new PrismaClient();
};

type GlobalWithPrisma = typeof globalThis & {
  prisma?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalWithPrisma;
const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const findCallbackValue = (items: CallbackItem[] | undefined, key: string): string | undefined => {
  if (!items) {
    return undefined;
  }

  const match = items.find((entry) => entry.Name === key);
  if (!match) {
    return undefined;
  }

  if (typeof match.Value === "string") {
    return match.Value;
  }

  if (typeof match.Value === "number") {
    return match.Value.toString();
  }

  return undefined;
};

const parseAmount = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }
  const amount = Number.parseFloat(value);
  return Number.isNaN(amount) ? undefined : amount;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log(`[${new Date().toISOString()}] CALLBACK RECEIVED: ${request.method} ${request.url}`);
  try {
    const payload = (await request.json()) as unknown;
    console.log("Raw payload:", payload);
    const parsed = callbackSchema.safeParse(payload);

    if (!parsed.success) {
      console.error(
        `[${new Date().toISOString()}] Invalid M-PESA callback payload`,
        parsed.error.flatten(),
      );
      return NextResponse.json("OK", { status: 200 });
    }

    const {
      Body: { stkCallback },
    } = parsed.data;

    const metadataItems = stkCallback.CallbackMetadata?.Item;
    const mpesaReceiptNumber = findCallbackValue(metadataItems, "MpesaReceiptNumber");
    const amountRaw = findCallbackValue(metadataItems, "Amount");
    const phoneNumber = findCallbackValue(metadataItems, "PhoneNumber");
    const transactionDate = findCallbackValue(metadataItems, "TransactionDate");
    const amount = parseAmount(amountRaw);

    const transaction = await prisma.transaction.upsert({
      where: { checkoutRequestId: stkCallback.CheckoutRequestID },
      update: {
        merchantRequestId: stkCallback.MerchantRequestID,
        resultCode: stkCallback.ResultCode,
        resultDesc: stkCallback.ResultDesc,
        amount: amount ?? undefined,
        mpesaReceiptNumber: mpesaReceiptNumber ?? undefined,
        phoneNumber: phoneNumber ?? undefined,
        transactionDate: transactionDate ?? undefined,
      },
      create: {
        merchantRequestId: stkCallback.MerchantRequestID,
        checkoutRequestId: stkCallback.CheckoutRequestID,
        resultCode: stkCallback.ResultCode,
        resultDesc: stkCallback.ResultDesc,
        amount: amount ?? undefined,
        mpesaReceiptNumber: mpesaReceiptNumber ?? undefined,
        phoneNumber: phoneNumber ?? undefined,
        transactionDate: transactionDate ?? undefined,
      },
      include: { order: true },
    });

    if (transaction.orderId) {
      if (stkCallback.ResultCode === 0) {
        await prisma.order.update({
          where: { id: transaction.orderId },
          data: { status: "PAID" },
        });
      } else {
        await prisma.order.update({
          where: { id: transaction.orderId },
          data: { status: "CANCELLED" },
        });
      }
    }

    console.info(
      `[${new Date().toISOString()}] Callback processed for CheckoutRequestID ${stkCallback.CheckoutRequestID} with ResultCode ${stkCallback.ResultCode}`,
    );

    return NextResponse.json("OK", { status: 200 });
  } catch (error: unknown) {
    console.error(
      `[${new Date().toISOString()}] Failed to process M-PESA callback`,
      error,
    );
    return NextResponse.json("OK", { status: 200 });
  }
}

