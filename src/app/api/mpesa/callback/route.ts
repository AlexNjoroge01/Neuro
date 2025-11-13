import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

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
  try {
    const body = (await request.json()) as unknown;
    const parsed = callbackSchema.safeParse(body);

    if (!parsed.success) {
      console.error(
        `[${new Date().toISOString()}] Invalid M-PESA callback payload`,
        parsed.error.flatten(),
      );
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
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

    await prisma.transaction.create({
      data: {
        merchantRequestId: stkCallback.MerchantRequestID,
        checkoutRequestId: stkCallback.CheckoutRequestID,
        resultCode: stkCallback.ResultCode,
        resultDesc: stkCallback.ResultDesc,
        amount,
        mpesaReceiptNumber,
        phoneNumber,
        transactionDate,
      },
    });

    console.info(
      `[${new Date().toISOString()}] Stored M-PESA callback for CheckoutRequestID ${stkCallback.CheckoutRequestID}`,
    );

    return NextResponse.json({ message: "Callback received successfully" });
  } catch (error: unknown) {
    console.error(
      `[${new Date().toISOString()}] Failed to process M-PESA callback`,
      error,
    );
    return NextResponse.json({ message: "Failed to process callback" }, { status: 500 });
  }
}

