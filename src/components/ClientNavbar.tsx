import { Bell, Search, LogIn, LogOut, ShoppingCart } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function ClientNavbar() {
  const { data: session, status } = useSession();
  const [cartCount, setCartCount] = useState(0);

  // ✅ Load cart count from localStorage
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const storedCart = JSON.parse(localStorage.getItem("cart") ?? "[]");
        setCartCount(storedCart.length);
      } catch {
        setCartCount(0);
      }
    };
    updateCartCount();

    // Listen for cart changes (from other tabs or triggers)
    window.addEventListener("storage", updateCartCount);
    return () => window.removeEventListener("storage", updateCartCount);
  }, []);

  return (
    <nav className="w-full bg-secondary border-b border-gray-200/20 p-4 flex justify-between items-center shadow-md">
      {/* Left: Logo + Search */}
      <div className="flex items-center gap-3 flex-1">
        {/* 🧠 Logo */}
        <Link href="/">
          <p className="text-xl font-bold mb-3 text-primary ">BuySmart Kenya</p>
        </Link>

        {/* 🔍 Search bar (takes remaining space) */}
       <div className="flex items-center gap-2 flex-1">
  <Search className="h-5 w-5 text-muted-foreground" />
  <input
    type="text"
    placeholder="What are you shopping for today?"
    className="w-xl bg-gray-100/10 border border-gray-200/20 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 text-white placeholder-gray-400"
  />
</div>

      </div>

      {/* Right: User info / auth controls */}
      <div className="flex items-center gap-4">
        {status === "authenticated" ? (
          <>
            <span className="text-sm text-muted-foreground truncate max-w-[160px] text-primary" >
              {session.user?.email}
            </span>
            <Bell className="h-5 w-5 text-muted-foreground cursor-pointer" />
            {/* 🛒 Cart Icon */}
            <Link href="/cart" className="relative">
              <ShoppingCart className="h-5 w-5 text-muted-foreground hover:text-primary transition" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <Image
              src="/user.png.jpg"
              alt="User profile"
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
            {/* 🔴 Logout icon */}
            <button
  onClick={() => signOut({ callbackUrl: "/auth/login" })}
  className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition flex items-center gap-2"
  title="Sign out"
>
  <LogOut className="h-5 w-5" />
  <span>Sign Out</span>
</button>

          </>
        ) : (
          <Link
            href="/auth/login"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition"
            title="Sign in"
          >
            <LogIn className="h-5 w-5" />
            <span className="hidden sm:inline">Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
