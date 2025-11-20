import { Bell, Search, LogIn, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import NotificationBell from "./NotificationBell";
import "next-auth";

// Add type patch for session.user (role)
declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: User & {
      role?: string;
    };
  }
}

export default function Navbar() {
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
    <nav className="w-full bg-background border-b border-gray-200/20 p-4 flex justify-between items-center shadow-md">

      <div className="flex items-center gap-3 flex-1">

        {/* 🔍 Search bar (takes remaining space) */}
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for products?"
            className="w-xl bg-gray-100/10 border border-gray-200/20 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>
      </div>

      {/* Right: User info / auth controls */}
      <div className="flex items-center gap-4">
        {status === "authenticated" ? (
          <>
            <span className="text-sm text-muted-foreground truncate max-w-[160px]">
              {session.user?.email}
            </span>
            {(session.user?.role === "ADMIN" || session.user?.role === "SUPERUSER") && (
              <NotificationBell />
            )}
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
              className="bg-secondary text-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary transition flex items-center gap-2"
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
