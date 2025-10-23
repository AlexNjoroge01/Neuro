import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#D6FF00] to-[#0F172A] flex items-center justify-center p-12">
      <div className="text-center space-y-16">
        <div>
          <h1 className="text-5xl font-bold text-white">Run. Sell. Grow.</h1>
          <p className="text-xl text-white/80 mt-6">All in One Smart System<br />Your all in one Enterprise Resource Planning and Point of Sale system.</p>
        </div>
        <nav className="grid gap-6">
          {status === "authenticated" ? (
            <Link className="text-[#D6FF00] text-lg underline hover:text-white" href="/dashboard">Go to Dashboard</Link>
          ) : (
            <>
              <Link className="text-[#D6FF00] text-lg underline hover:text-white" href="/auth/login">Sign in</Link>
              <Link className="text-[#D6FF00] text-lg underline hover:text-white" href="/auth/register">Create an account</Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
