import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLogged, setKeepLogged] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    if (res?.error) setError("Invalid email or password");
    if (res?.ok) window.location.href = res.url ?? "/dashboard";
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Background Image + Translucent Card */}
      <div className="relative flex-1 hidden md:block">
        <Image
          src="/d2.jpg"
          alt="Login Background"
          fill
          className="object-cover"
        />
        <div className="absolute bottom-8 left-0 right-0 mx-4 bg-white/60 backdrop-blur-sm text-black p-6 rounded-lg border border-white/20 shadow-lg">
          <h2 className="text-2xl font-bold">Business Management Made Simple</h2>
          <p className="text-sm mt-2">
            Streamlining operations across departments with one integrated platform that handles everything from products, finance, and inventory management
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <h1 className="text-2xl font-bold text-center text-foreground">
            Sign In to Your Account
          </h1>

          <form onSubmit={onSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md text-center">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="w-full pl-10 pr-3 py-3 bg-gray-100/10 border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  type="text"
                  placeholder="Enter Email"
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
                  placeholder="Enter Your Password"
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

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepLogged}
                  onChange={(e) => setKeepLogged(e.target.checked)}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-foreground">Keep me logged in on this Device.</span>
              </label>
              <Link href="/auth/forgot" className="text-primary hover:underline">
                Forgot Your Password?
              </Link>
            </div>

            <button className="w-full bg-primary text-primary-foreground py-3 rounded-md font-medium hover:bg-primary/90 transition">
              Log In
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Dont Have an Account?{" "}
            <Link href="/auth/register" className="text-primary font-medium hover:underline">
              Sign Up
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