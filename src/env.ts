import { z } from 'zod';

/**
 * Environment variable validation schema
 * This ensures all required env vars are present and valid at startup
 */
const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

    // NextAuth
    NEXTAUTH_SECRET: z
        .string()
        .min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
    NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').optional(),

    // M-PESA
    MPESA_CONSUMER_KEY: z.string().min(1, 'MPESA_CONSUMER_KEY is required'),
    MPESA_CONSUMER_SECRET: z.string().min(1, 'MPESA_CONSUMER_SECRET is required'),
    MPESA_SHORTCODE: z.string().min(1, 'MPESA_SHORTCODE is required'),
    MPESA_PASSKEY: z.string().min(1, 'MPESA_PASSKEY is required'),
    MPESA_CALLBACK_URL: z.string().url('MPESA_CALLBACK_URL must be a valid URL'),
    MPESA_BASE_URL: z
        .string()
        .url('MPESA_BASE_URL must be a valid URL')
        .default('https://sandbox.safaricom.co.ke'),

    // Email
    RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),

    // Node environment
    NODE_ENV: z
        .enum(['development', 'production', 'test'])
        .default('development'),
});

/**
 * Validates and parses environment variables
 * Throws an error with detailed messages if validation fails
 */
function validateEnv() {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        console.error('❌ Environment validation failed:');
        console.error('');

        result.error.issues.forEach((issue) => {
            console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
        });

        console.error('');
        console.error('Please check your .env file and ensure all required variables are set.');

        throw new Error('Invalid environment variables');
    }

    return result.data;
}

/**
 * Validated environment variables
 * Use this instead of process.env throughout the application
 */
export const env = validateEnv();
