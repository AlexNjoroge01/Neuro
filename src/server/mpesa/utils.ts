import { TRPCError } from "@trpc/server";

export const mpesaBaseUrl =
  process.env.MPESA_BASE_URL?.replace(/\/$/, "") ?? "https://sandbox.safaricom.co.ke";

type AccessTokenCache = {
  token: string;
  expiresAt: number;
};

let accessTokenCache: AccessTokenCache | null = null;

export type AccessTokenPayload = {
  accessToken: string;
  expiresInSeconds: number;
};

export const getRequiredEnv = (key: keyof NodeJS.ProcessEnv): string => {
  const value = process.env[key];
  if (!value) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Missing environment variable: ${key}`,
    });
  }
  return value;
};

export const buildTimestamp = (): string => {
  const now = new Date();
  const pad = (value: number): string => value.toString().padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(
    now.getHours(),
  )}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

export const fetchAccessToken = async (): Promise<AccessTokenPayload> => {
  const consumerKey = getRequiredEnv("MPESA_CONSUMER_KEY");
  const consumerSecret = getRequiredEnv("MPESA_CONSUMER_SECRET");
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  if (accessTokenCache && accessTokenCache.expiresAt > Date.now()) {
    return {
      accessToken: accessTokenCache.token,
      expiresInSeconds: Math.floor((accessTokenCache.expiresAt - Date.now()) / 1000),
    };
  }

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

  const payload = (await response.json()) as { access_token?: string; expires_in?: string };
  if (!payload.access_token || !payload.expires_in) {
    console.error(
      `[${new Date().toISOString()}] Unexpected token response from M-PESA:`,
      payload,
    );
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Received unexpected response from M-PESA token endpoint.",
    });
  }

  const expiresInSeconds = Number.parseInt(payload.expires_in, 10);
  if (Number.isNaN(expiresInSeconds)) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Invalid expiry time returned from M-PESA token endpoint.",
    });
  }

  const safetyBufferSeconds = 30;
  accessTokenCache = {
    token: payload.access_token,
    expiresAt: Date.now() + (expiresInSeconds - safetyBufferSeconds) * 1000,
  };

  return {
    accessToken: payload.access_token,
    expiresInSeconds,
  };
};

export const normalizePhoneNumber = (input: string): string => {
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
