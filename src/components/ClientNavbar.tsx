import { Bell, Search, LogIn, LogOut, ShoppingCart, ChevronDown } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/router";

export default function ClientNavbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: serverCart } = trpc.cart.get.useQuery(undefined, { enabled: status === "authenticated" });
  const [localCount, setLocalCount] = useState(0);
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const { data: results } = trpc.products.search.useQuery(search, { enabled: search.trim().length >= 2 });

  // Close menu when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpenMenu(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Guest/local fallback
  useEffect(() => {
    if (status === "authenticated") return; // serverCart will drive count
    const updateCartCount = () => {
      try {
        const storedCart = JSON.parse(localStorage.getItem("cart") ?? "[]");
        const count = Array.isArray(storedCart)
          ? storedCart.reduce((sum: number, i: any) => sum + (i.quantity ?? 1), 0)
          : 0;
        setLocalCount(count);
      } catch {
        setLocalCount(0);
      }
    };
    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    return () => window.removeEventListener("storage", updateCartCount);
  }, [status]);

  const cartCount = useMemo(() => {
    if (status === "authenticated") {
      return (serverCart?.items ?? []).reduce((sum, i) => sum + i.quantity, 0);
    }
    return localCount;
  }, [status, serverCart, localCount]);

  const firstName = useMemo(() => {
    const n = session?.user?.name || "";
    return n.split(" ")[0] || "";
  }, [session?.user?.name]);

  const avatarSrc = session?.user?.image || "/user.png.jpg";

  return (
    <nav className="w-full bg-secondary border-b border-gray-200/20 p-4 flex justify-between items-center shadow-md">
      {/* Left: Logo + Search */}
      <div className="flex items-center gap-3 flex-1">
        <Link href="/">
          <p className="text-xl font-bold mb-3 text-primary ">BuySmart Kenya</p>
        </Link>
        <div className="flex items-center gap-2 flex-1 relative">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowResults(true); }}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="What are you shopping for today?"
            className="w-xl bg-gray-100/10 border border-gray-200/20 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 text-white placeholder-gray-400"
          />
          {showResults && (results?.length ?? 0) > 0 && (
            <div className="absolute top-8 left-0 w-full bg-background border border-gray-200/30 rounded-md shadow z-40 max-h-80 overflow-auto">
              {(results ?? []).map((p) => (
                <Link key={p.id} href={`/shop/${p.id}`} className="block px-3 py-2 text-sm hover:bg-gray-100/10">
                  {p.name} {p.brand ? <span className="text-xs text-muted-foreground">· {p.brand}</span> : null}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: User info / auth controls */}
      <div className="flex items-center gap-4">
        {/* Cart Icon with count */}
        <Link href="/cart" className="relative">
          <ShoppingCart className="h-5 w-5 text-muted-foreground hover:text-primary transition" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>

        {status === "authenticated" ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpenMenu(v => !v)}
              className="flex items-center gap-2"
            >
              <span className="text-sm truncate max-w-[160px] text-primary" >
                {firstName ? `Hi, ${firstName}` : session.user?.email}
              </span>
              <Image
                src={avatarSrc}
                alt="User profile"
                width={32}
                height={32}
                className="rounded-full object-cover h-8 w-8 border border-gray-200/30"
              />
              <ChevronDown className="h-4 w-4  text-primary" />
            </button>
            {openMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-background border border-gray-200/30 rounded-md shadow-lg z-50">
                <Link href="/account" className="block px-3 py-2 text-sm hover:bg-gray-100/10">Account</Link>
                <Link href="/orders" className="block px-3 py-2 text-sm hover:bg-gray-100/10">My Orders</Link>
                <Link href="/cart" className="block px-3 py-2 text-sm hover:bg-gray-100/10">Cart</Link>
                <Link href="/shop" className="block px-3 py-2 text-sm hover:bg-gray-100/10">Shop</Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/login" })}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100/10 text-red-600"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
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

        <Bell className="h-5 w-5 text-muted-foreground cursor-pointer" />
      </div>
    </nav>
  );
}
