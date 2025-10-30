import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Failed to register");
    } else {
      setSuccess(true);
      setName("");
      setEmail("");
      setPassword("");
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="w-1/2 relative">
        <Image src="/b1.jpg" alt="Register Background" layout="fill" objectFit="cover" />
      </div>
      <div className="w-1/2 p-6 flex items-center justify-center bg-background">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border p-6 rounded-md">
          <h1 className="text-xl font-semibold">Create account</h1>
          {error ? <div className="text-red-600 text-sm">{error}</div> : null}
          {success ? <div className="text-green-600 text-sm">Account created. You can now <Link className="underline" href="/auth/login">sign in</Link>.</div> : null}
          <div className="space-y-1">
            <label className="text-sm">Name</label>
            <input 
              className="w-full border rounded px-3 py-2 bg-gray-100/10" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm">Email</label>
            <input 
              className="w-full border rounded px-3 py-2 bg-gray-100/10" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm">Password</label>
            <input 
              className="w-full border rounded px-3 py-2 bg-gray-100/10" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button className="w-full bg-primary text-primary-foreground py-2 rounded">Create account</button>
          <p className="text-sm text-muted-foreground">Already have an account? <Link className="underline" href="/auth/login">Sign in</Link></p>
        </form>
      </div>
    </div>
  );
}