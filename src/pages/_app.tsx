import type { AppProps } from "next/app";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { trpc } from "@/utils/trpc";
import "../app/globals.css";

type AppPropsWithSession = AppProps<{ session?: Session }>;

function MyApp({ Component, pageProps }: AppPropsWithSession) {
  const { session, ...rest } = pageProps;
  return (
    <SessionProvider session={session}>
      <>
        <Component {...rest} />
        <Toaster richColors position="top-right" />
      </>
    </SessionProvider>
  );
}

export default trpc.withTRPC(MyApp);