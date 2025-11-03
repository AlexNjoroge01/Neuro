import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      {/* LEFT SIDE: Background + Translucent Card */}
      <div className="relative flex-1 hidden md:block">
        <Image
          src="/d2.jpg"
          alt="Register Background"
          fill
          className="object-cover"
        />
        <div className="absolute bottom-8 left-0 right-0 mx-4 bg-white/60 backdrop-blur-sm text-black p-6 rounded-lg border border-white/20 shadow-lg">
          <h2 className="text-2xl font-bold">Business Management Made Simple</h2>
          <p className="text-sm mt-2">
            streamlining operations across departments with one integrated platform that handles everything from products, finance, and inventory management
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Register Form */}
      <div className="flex-1 bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <h1 className="text-2xl font-bold text-center text-foreground">
            Create Your Account
          </h1>

          <form onSubmit={onSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 text-sm p-3 rounded-md text-center">
                Account created successfully! You can now{" "}
                <Link href="/auth/login" className="underline font-medium">
                  sign in
                </Link>
                .
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="w-full pl-10 pr-3 py-3 bg-gray-100/10 border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="w-full pl-10 pr-3 py-3 bg-gray-100/10 border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="w-full pl-10 pr-12 py-3 bg-gray-100/10 border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <button className="w-full bg-primary text-primary-foreground py-3 rounded-md font-medium hover:bg-primary/90 transition">
              Create Account
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground">
            By Continuing you Agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms & Conditions
            </Link>
            ,{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            , and{" "}
            <Link href="/cookies" className="underline hover:text-foreground">
              Cookies Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}