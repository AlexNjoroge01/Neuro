import type { AppProps } from "next/app";
import { trpc } from "@/utils/trpc";
import "../app/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
	return <Component {...pageProps} />;
}

export default trpc.withTRPC(MyApp); 