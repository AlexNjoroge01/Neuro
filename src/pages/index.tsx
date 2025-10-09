import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Home() {
    const { data: session, status } = useSession();
    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-semibold">Neuro POS</h1>
            <p className="text-muted-foreground">Starter dashboard is wired with tRPC + Prisma.</p>
            <nav className="grid gap-2">
                {status === "authenticated" ? (
                    <Link className="text-blue-600 underline" href="/dashboard">Go to Dashboard</Link>
                ) : (
                    <>
                        <Link className="text-blue-600 underline" href="/auth/login">Sign in</Link>
                        <Link className="text-blue-600 underline" href="/auth/register">Create an account</Link>
                    </>
                )}
            </nav>
        </div>
    );
} 