import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createRouter, protectedProcedure } from "@/server/createRouter";

const mpesaBaseUrl =
  process.env.MPESA_BASE_URL?.replace(/\/$/, "") ?? "https://sandbox.safaricom.co.ke";

const accessTokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.string(),
});

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

type AccessTokenPayload = {
  accessToken: string;
  expiresInSeconds: number;
};

const getRequiredEnv = (key: keyof NodeJS.ProcessEnv): string => {
  const value = process.env[key];
  if (!value) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Missing environment variable: ${key}`,
    });
  }
  return value;
};

const buildTimestamp = (): string => {
  const now = new Date();
  const pad = (value: number): string => value.toString().padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(
    now.getHours(),
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

const normalizePhoneNumber = (input: string): string => {
  const digitsOnly = input.replace(/\D/g, "");
  if (digitsOnly.startsWith("254") && digitsOnly.length === 12) {
    return digitsOnly;
  }
  if (digitsOnly.startsWith("0") && digitsOnly.length === 10) {
    return `254${digitsOnly.substring(1)}`;
  }
  if (digitsOnly.startsWith("7") && digitsOnly.length === 9) {
    return `254${digitsOnly}`;
  }
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Invalid phone number format. Expected Kenyan MSISDN (e.g. 2547XXXXXXXX).",
  });
};

const fetchAccessToken = async (): Promise<AccessTokenPayload> => {
  const consumerKey = getRequiredEnv("MPESA_CONSUMER_KEY");
  const consumerSecret = getRequiredEnv("MPESA_CONSUMER_SECRET");
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const response = await fetch(
    `${mpesaBaseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    },
  );

  if (!response.ok) {
    const message = `Failed to acquire M-PESA access token (status ${response.status}).`;
    console.error(`[${new Date().toISOString()}] ${message}`);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Unable to obtain M-PESA access token.",
    });
  }

  const payload = accessTokenResponseSchema.safeParse((await response.json()) as unknown);
  if (!payload.success) {
    console.error(
      `[${new Date().toISOString()}] Unexpected token response from M-PESA:`,
      payload.error.flatten(),
    );
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Received unexpected response from M-PESA token endpoint.",
    });
  }

  const expiresInSeconds = Number.parseInt(payload.data.expires_in, 10);
  if (Number.isNaN(expiresInSeconds)) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Invalid expiry time returned from M-PESA token endpoint.",
    });
  }

  return {
    accessToken: payload.data.access_token,
    expiresInSeconds,
  };
};

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

      const { accessToken } = await fetchAccessToken();
      const timestamp = buildTimestamp();
      const password = Buffer.from(`${businessShortCode}${passkey}${timestamp}`).toString(
        "base64",
      );

      console.info(
        `[${new Date().toISOString()}] Initiating STK push for user ${ctx.session?.user?.id ?? "unknown"
        }`,
      );

      const stkPayload = {
        BusinessShortCode: businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: normalizedPhone,
        PartyB: businessShortCode,
        PhoneNumber: normalizedPhone,
        CallBackURL: callbackUrl,
        AccountReference: "MyOnlineShop",
        TransactionDesc: "Order Payment",
      };

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
        throw new TRPCError({
          code: "BAD_REQUEST",
          message,
        });
      }

      const parsedSuccess = stkPushSuccessResponseSchema.safeParse(responseBody);
      if (!parsedSuccess.success) {
        const parsedError = stkPushErrorResponseSchema.safeParse(responseBody);
        if (parsedError.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: parsedError.data.errorMessage,
          });
        }

        console.error(
          `[${new Date().toISOString()}] Unexpected STK push response body:`,
          responseBody,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Received unexpected response from M-PESA STK push endpoint.",
        });
      }

      return parsedSuccess.data;
    }),
});

