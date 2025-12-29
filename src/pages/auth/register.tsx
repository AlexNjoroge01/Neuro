import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "react-toastify";

// Zod schema with strict validation (same strong password rules as login)
const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    // Client-side Zod validation
    const result = registerSchema.safeParse({ name, email, password });

    if (!result.success) {
      const errors: { name?: string; email?: string; password?: string } = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as "name" | "email" | "password";
        errors[path] = issue.message;
      });
      setFieldErrors(errors);
      toast.error(result.error.issues[0].message);
      setIsLoading(false);
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Failed to register");
      toast.error(j.error ?? "Failed to register");
    } else {
      setSuccess(true);
      toast.success("Account created successfully!");
      setName("");
      setEmail("");
      setPassword("");
    }

    setIsLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-1 flex-col lg:flex-row">
      {/* LEFT SIDE: Background + Translucent Card */}
      <div className="relative flex-1 hidden lg:block">
        <Image
          src="/d2.jpg"
          alt="Register Background"
          fill
          className="object-cover"
        />
        <div className="absolute bottom-8 left-0 right-0 mx-8 bg-white/60 backdrop-blur-sm text-black p-8 rounded-lg border border-white/20 shadow-lg">
          <h2 className="text-3xl font-bold">Business Management Made Simple</h2>
          <p className="text-base mt-3">
            Streamlining operations across departments with one integrated platform that handles everything from products, finance, and inventory management
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Register Form */}
      <div className="flex-1 bg-background flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-foreground">
            Create Your Account
          </h1>

          <form onSubmit={onSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-4 rounded-md text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 text-sm p-4 rounded-md text-center">
                Account created successfully! You can now{" "}
                <Link href="/auth/login" className="underline font-medium">
                  sign in
                </Link>
                .
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  className={`w-full pl-11 pr-4 py-3.5 bg-gray-100/10 border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition ${
                    fieldErrors.name ? "border-red-500" : "border-input"
                  }`}
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.name && (
                <p className="text-sm text-red-600 mt-1.5">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  className={`w-full pl-11 pr-4 py-3.5 bg-gray-100/10 border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition ${
                    fieldErrors.email ? "border-red-500" : "border-input"
                  }`}
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-sm text-red-600 mt-1.5">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  className={`w-full pl-11 pr-12 py-3.5 bg-gray-100/10 border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition ${
                    fieldErrors.password ? "border-red-500" : "border-input"
                  }`}
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-sm text-red-600 mt-1.5">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-md font-medium hover:bg-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-secondary font-medium hover:underline">
              Sign In
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground px-4">
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