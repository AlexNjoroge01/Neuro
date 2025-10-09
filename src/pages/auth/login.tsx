import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/dashboard" });
    if (res?.error) setError("Invalid email or password");
    if (res?.ok) window.location.href = res.url ?? "/dashboard";
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border p-6 rounded-md">
        <h1 className="text-xl font-semibold">Sign in</h1>
        {error ? <div className="text-red-600 text-sm">{error}</div> : null}
        <div className="space-y-1">
          <label className="text-sm">Email</label>
          <input className="w-full border rounded px-3 py-2 bg-background" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input className="w-full border rounded px-3 py-2 bg-background" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="w-full bg-black text-white py-2 rounded">Sign in</button>
        <p className="text-sm text-muted-foreground">No account? <Link className="underline" href="/auth/register">Create one</Link></p>
      </form>
    </div>
  );
}

