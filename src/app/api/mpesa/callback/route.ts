import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { Resend } from "resend";
import { OrderEmailTemplate } from "@/components/email-template";

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
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ========== M-PESA CALLBACK START ==========`);
  console.log(`[${timestamp}] Method: ${request.method}`);
  console.log(`[${timestamp}] URL: ${request.url}`);

  try {
    // Read raw body first to handle empty/malformed JSON
    const rawBody = await request.text();
    console.log(`[${timestamp}] Raw body length: ${rawBody.length}`);
    console.log(`[${timestamp}] Raw body:`, rawBody);

    // Handle empty body
    if (!rawBody || rawBody.trim() === '') {
      console.warn(`[${timestamp}] Empty callback body received`);
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" }, { status: 200 });
    }

    // Parse JSON safely
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
      console.log(`[${timestamp}] Parsed payload:`, JSON.stringify(payload, null, 2));
    } catch (parseError) {
      console.error(`[${timestamp}] JSON parse error:`, parseError);
      console.error(`[${timestamp}] Failed to parse body:`, rawBody);
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" }, { status: 200 });
    }

    const parsed = callbackSchema.safeParse(payload);

    if (!parsed.success) {
      console.error(
        `[${timestamp}] Invalid M-PESA callback payload`,
        parsed.error.flatten(),
      );
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" }, { status: 200 });
    }

    const {
      Body: { stkCallback },
    } = parsed.data;

    console.log(`[${timestamp}] CheckoutRequestID: ${stkCallback.CheckoutRequestID}`);
    console.log(`[${timestamp}] ResultCode: ${stkCallback.ResultCode}`);

    // Check for duplicate callback (idempotency)
    const existingTransaction = await prisma.transaction.findUnique({
      where: { checkoutRequestId: stkCallback.CheckoutRequestID },
    });

    if (existingTransaction && existingTransaction.resultCode !== null) {
      console.log(`[${timestamp}] Duplicate callback detected for ${stkCallback.CheckoutRequestID}, already processed with ResultCode ${existingTransaction.resultCode}`);
      return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" }, { status: 200 });
    }

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

    console.log(`[${new Date().toISOString()}] Transaction updated:`, {
      id: transaction.id,
      orderId: transaction.orderId,
      resultCode: stkCallback.ResultCode,
    });

    if (transaction.orderId) {
      if (stkCallback.ResultCode === 0) {
        console.log(`[${new Date().toISOString()}] Payment successful, updating order status to PAID`);

        // Payment successful - update order status
        await prisma.order.update({
          where: { id: transaction.orderId },
          data: { status: "PAID" },
        });

        // Fetch complete order details with user and items
        const order = await prisma.order.findUnique({
          where: { id: transaction.orderId },
          include: {
            user: true,
            items: {
              include: {
                product: true,
              },
            },
            transactions: true,
          },
        });

        if (order) {
          console.log(`[${new Date().toISOString()}] Order fetched successfully:`, {
            orderId: order.id,
            userId: order.userId,
            total: order.total,
          });

          try {
            // Get all admin and superuser accounts
            const admins = await prisma.user.findMany({
              where: {
                role: {
                  in: ["ADMIN", "SUPERUSER"],
                },
              },
            });

            console.log(`[${new Date().toISOString()}] Found ${admins.length} admin(s)`);

            if (admins.length === 0) {
              console.warn(`[${new Date().toISOString()}] WARNING: No admin users found!`);
            }

            // Create notifications for all admins
            const notificationPromises = admins.map((admin) => {
              console.log(`[${new Date().toISOString()}] Creating notification for admin: ${admin.email}`);
              return prisma.notification.create({
                data: {
                  userId: admin.id,
                  orderId: order.id,
                  title: "New Paid Order Received",
                  message: `Order #${order.id.slice(0, 8)} from ${order.user.name || order.user.email} - KES ${order.total.toLocaleString()}`,
                },
              });
            });

            const createdNotifications = await Promise.all(notificationPromises);
            console.log(`[${new Date().toISOString()}] Successfully created ${createdNotifications.length} notification(s)`);

            // Send email notification
            try {
              const resendApiKey = process.env.RESEND_API_KEY;
              if (resendApiKey) {
                const resend = new Resend(resendApiKey);

                const orderItems = order.items.map((item) => ({
                  name: item.product?.name || "Unknown Product",
                  quantity: item.quantity,
                  price: item.price,
                }));

                // Get phone number from the transaction (captured during M-Pesa payment)
                const orderTransaction = order.transactions?.[0];
                const customerPhone = orderTransaction?.phoneNumber || "N/A";

                await resend.emails.send({
                  from: "Aggies World <onboarding@resend.dev>",
                  to: ["alexnjoroge102@gmail.com"],
                  subject: `New Order #${order.id.slice(0, 8)} - KES ${order.total.toLocaleString()}`,
                  react: OrderEmailTemplate({
                    customerName: order.user.name || "N/A",
                    customerEmail: order.user.email || "N/A",
                    customerPhone: customerPhone,
                    customerAddress: undefined,
                    orderId: order.id,
                    orderTotal: order.total,
                    orderItems: orderItems,
                    orderDate: order.createdAt.toLocaleString(),
                  }),
                });

                console.info(
                  `[${new Date().toISOString()}] Email notification sent for order ${order.id}`,
                );
              } else {
                console.warn(
                  `[${new Date().toISOString()}] RESEND_API_KEY not configured, skipping email notification`,
                );
              }
            } catch (emailError) {
              console.error(
                `[${new Date().toISOString()}] Failed to send email notification`,
                emailError,
              );
              // Don't fail the callback if email fails
            }
          } catch (notificationError) {
            console.error(
              `[${new Date().toISOString()}] CRITICAL: Failed to create notifications`,
              notificationError,
            );
            // Log but don't fail the callback
          }
        } else {
          console.error(`[${new Date().toISOString()}] ERROR: Order not found for ID ${transaction.orderId}`);
        }
      } else {
        console.log(`[${new Date().toISOString()}] Payment failed, updating order status to CANCELLED`);
        await prisma.order.update({
          where: { id: transaction.orderId },
          data: { status: "CANCELLED" },
        });
      }
    } else {
      console.warn(`[${new Date().toISOString()}] WARNING: Transaction has no orderId`);
    }

    console.info(
      `[${timestamp}] Callback processed for CheckoutRequestID ${stkCallback.CheckoutRequestID} with ResultCode ${stkCallback.ResultCode}`,
    );
    console.log(`[${timestamp}] ========== M-PESA CALLBACK END ==========`);

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" }, { status: 200 });
  } catch (error: unknown) {
    console.error(
      `[${timestamp}] CRITICAL ERROR: Failed to process M-PESA callback`,
      error,
    );
    console.log(`[${timestamp}] ========== M-PESA CALLBACK END (ERROR) ==========`);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" }, { status: 200 });
  }
}
