import type { AppProps } from "next/app";
import { trpc } from "@/utils/trpc";
import "../app/globals.css";
import { SessionProvider } from "next-auth/react";

function MyApp({ Component, pageProps }: AppProps) {
    const { session, ...rest } = pageProps as any;
    return (
        <SessionProvider session={session}>
            <Component {...rest} />
        </SessionProvider>
    );
}

export default trpc.withTRPC(MyApp);