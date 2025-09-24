import { createTRPCNext } from "@trpc/next";
import { httpBatchLink, loggerLink } from "@trpc/client";
import type { AppRouter } from "@/server/routers/app";

export const trpc = createTRPCNext<AppRouter>({
	config() {
		return {
			links: [
				loggerLink({ enabled: () => process.env.NODE_ENV === "development" }),
				httpBatchLink({ url: "/api/trpc" }),
			],
		};
	},
	ssr: false,
}); 