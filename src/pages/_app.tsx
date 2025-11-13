import type { AppProps } from "next/app";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import { trpc } from "@/utils/trpc";
import "../app/globals.css";
import "react-toastify/dist/ReactToastify.css";

type AppPropsWithSession = AppProps<{ session?: Session }>;

function MyApp({ Component, pageProps }: AppPropsWithSession) {
  const { session, ...rest } = pageProps;
  return (
    <SessionProvider session={session}>
      <>
        <Component {...rest} />
        <ToastContainer position="top-right" newestOnTop draggable={false} />
      </>
    </SessionProvider>
  );
}

export default trpc.withTRPC(MyApp);