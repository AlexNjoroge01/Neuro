"use client";

import { Search, LogIn, ShoppingCart, ChevronDown, Menu, X } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/utils/trpc";
import { toast } from "react-toastify";
import { AnimatePresence, motion } from "framer-motion";

export default function ClientNavbar() {
  const { data: session, status } = useSession();
  const { data: serverCart } = trpc.cart.get.useQuery(undefined, { enabled: status === "authenticated" });
  const [localCount, setLocalCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const { data: results, isFetching } = trpc.products.search.useQuery(search, {
    enabled: search.trim().length >= 2
  });

  // Ref for mobile menu (bottom sheet)
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  // Ref for hamburger button (to exclude it from outside clicks)
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu only when clicking outside of it or the hamburger button
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(e.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  // Guest cart fallback
  useEffect(() => {
    if (status === "authenticated") return;
    const updateCount = () => {
      try {
        const cart = JSON.parse(JSON.parse(localStorage.getItem("cart") ?? "[]"));

        const count = Array.isArray(cart)
          ? cart.reduce((sum: number, i) => sum + (i.quantity ?? 1), 0)
          : 0;
        setLocalCount(count);
      } catch {
        setLocalCount(0);
      }
    };
    updateCount();
    window.addEventListener("storage", updateCount);
    return () => window.removeEventListener("storage", updateCount);
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

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/auth/login" });
      toast.success("Signed out successfully");
    } catch {
      toast.error("Sign out failed. Please try again.");
    }
  };

  return (
    <nav className="w-full bg-secondary border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/">
              <p className="text-2xl font-bold text-primary">Dukafiy</p>
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setShowResults(true); }}
                onBlur={() => setTimeout(() => setShowResults(false), 150)}
                placeholder="What are you shopping for today?"
                className="w-full pl-10 pr-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2  placeholder-muted-foreground"
              />
              <AnimatePresence>
                {showResults && search.trim().length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-1 w-full bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-auto"
                  >
                    {isFetching ? (
                      <div className="px-4 py-8 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                          <span className="text-sm">Searching...</span>
                        </div>
                      </div>
                    ) : results && results.length > 0 ? (
                      results.map((p) => (
                        <Link
                          key={p.id}
                          href={`/shop/${p.id}`}
                          onClick={() => setMobileMenuOpen(false)} // Optional: close menu on selection
                          className="block px-4 py-3 text-sm hover:bg-accent transition"
                        >
                          {p.name}{" "}
                          {p.brand && <span className="text-xs text-muted-foreground">· {p.brand}</span>}
                        </Link>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                        No products found
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Desktop Right Icons */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/cart" className="relative">
              <ShoppingCart className="h-6 w-6 text-primary hover:text-primary transition" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {status === "authenticated" ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex bg-primary/50 border-sm px-4 py-2 rounded-sm items-center gap-3 hover:bg-secondary/70 transition"
                  aria-haspopup="true"
                  aria-expanded={mobileMenuOpen}
                >
                  <span className="flex text-sm text-primary font-medium">
                    Hi, {firstName || session.user?.email}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-primary transition ${mobileMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {mobileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-56 bg-secondary border border-border rounded-lg shadow-xl"
                    >
                      <Link href="/account" className="block px-4 py-3 text-sm text-primary hover:bg-secondary/70 transition">Account</Link>
                      <Link href="/orders" className="block px-4 py-3 text-sm text-primary hover:bg-secondary/70 transition">My Orders</Link>
                      <Link href="/cart" className="block px-4 py-3 text-sm text-primary hover:bg-secondary/70 transition">Cart</Link>
                      <Link href="/shop" className="block px-4 py-3 text-sm text-primary hover:bg-secondary/70 transition">Shop</Link>
                      <hr className="border-border" />
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-secondary/70 transition"
                      >
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/auth/login" className="flex items-center gap-2 text-secondary bg-primary  px-2 py-2 rounded-md hover:bg-primary/90 transition">
                <LogIn className="h-5 w-5" />
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-4">
            <Link href="/cart" className="relative">
              <ShoppingCart className="h-6 w-6 text-primary" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              ref={hamburgerRef}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-primary"
            >
              {mobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet Menu + Search */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="md:hidden fixed inset-x-0 top-16 bg-secondary border-t border-border z-40"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowResults(true);
                  }}
                  onBlur={() => setTimeout(() => setShowResults(false), 200)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />

                {/* ← THIS IS THE MISSING PART → Mobile Search Results Dropdown */}
                <AnimatePresence>
                  {showResults && search.trim().length >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-auto"
                    >
                      {isFetching ? (
                        <div className="px-4 py-8 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                            <span className="text-sm">Searching...</span>
                          </div>
                        </div>
                      ) : results && results.length > 0 ? (
                        results.map((p) => (
                          <Link
                            key={p.id}
                            href={`/shop/${p.id}`}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              setShowResults(false);
                            }}
                            className="block px-4 py-3 text-sm hover:bg-accent transition"
                          >
                            {p.name}{" "}
                            {p.brand && <span className="text-xs text-muted-foreground">· {p.brand}</span>}
                          </Link>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                          No products found
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Links */}
              {status === "authenticated" ? (
                <>
                  <div className="flex items-center gap-3 pb-3 border-b border-border">
                    <div>
                      <p className="font-medium text-primary">Hi, {firstName}</p>
                      <p className="text-xs text-primary">{session.user?.email}</p>
                    </div>
                  </div>
                  <Link href="/account" className="block py-2 text-primary">Account</Link>
                  <Link href="/orders" className="block py-2 text-primary">My Orders</Link>
                  <Link href="/cart" className="block py-2 text-primary">Cart ({cartCount})</Link>
                  <Link href="/shop" className="block py-2 text-primary">Shop</Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left py-2 text-red-600"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link href="/auth/login" className="flex items-center gap-2 py-2 bg-primary text-secondary">
                  <LogIn className="h-5 w-5" />
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}