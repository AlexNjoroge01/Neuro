import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Package,
  Boxes,
  BarChart3,
  Settings,
  Truck,
  Wallet,
  UsersRound,
  Power,
  ShoppingBag,
  ClipboardList,
  User,
  UserCog,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useMemo } from "react";
import "next-auth";

// Add type patch for session.user (role)
declare module "next-auth" {
  interface User {
    role?: string;
  }
}

const ADMIN_ITEMS = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/products", label: "Products", Icon: Package },
  { href: "/inventory", label: "Inventory", Icon: Boxes },
  { href: "/sales", label: "POS", Icon: BarChart3 },
  { href: "/accounting", label: "Accounting", Icon: Wallet },
  //{ href: "/fleet", label: "Fleet", Icon: Truck },
  //{ href: "/hr", label: "HR & Payroll", Icon: UsersRound },
  //{ href: "/reports", label: "Reports", Icon: BarChart3 },
  { href: "/shop", label: "Shop", Icon: ShoppingBag },
  { href: "/orders", label: "All Orders", Icon: ClipboardList },
  { href: "/account", label: "Account", Icon: User },
  //{ href: "/settings", label: "Settings", Icon: Settings },
];

const SUPERUSER_ITEMS = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/products", label: "Products", Icon: Package },
  { href: "/inventory", label: "Inventory", Icon: Boxes },
  { href: "/sales", label: "POS", Icon: BarChart3 },
  { href: "/accounting", label: "Accounting", Icon: Wallet },
  { href: "/fleet", label: "Fleet", Icon: Truck },
  { href: "/hr", label: "HR & Payroll", Icon: UsersRound },
  { href: "/reports", label: "Reports", Icon: BarChart3 },
  { href: "/shop", label: "Shop", Icon: ShoppingBag },
  { href: "/orders", label: "All Orders", Icon: ClipboardList },
  { href: "/account", label: "Account", Icon: User },
  { href: "/settings", label: "Settings", Icon: Settings },
  { href: "/admin-users", label: "Admin Management", Icon: UserCog },
];

const CUSTOMER_ITEMS = [
  { href: "/shop", label: "Shop", Icon: Package },
  { href: "/cart", label: "Cart", Icon: Boxes },
  { href: "/orders", label: "Orders", Icon: BarChart3 },
  { href: "/account", label: "Account", Icon: Settings },
];

export default function Sidebar() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = session?.user?.role;

  const navItems = useMemo(() => {
    if (status === "loading") {
      // While auth is resolving, render no items to avoid flicker between customer/admin menus
      return [] as typeof CUSTOMER_ITEMS;
    }
    if (status !== "authenticated") {
      // Not logged in, show public shop/cart only
      return CUSTOMER_ITEMS.filter((item) =>
        ["/shop", "/cart"].includes(item.href),
      );
    }
    if (role === "SUPERUSER") return SUPERUSER_ITEMS;
    if (role === "ADMIN") return ADMIN_ITEMS;
    return CUSTOMER_ITEMS;
  }, [role, status]);

  return (
    <aside className="w-64 h-screen flex flex-col border-r border-gray-200/20 p-4 md:flex bg-white">
      {/* Logo / Title */}
      <div className="px-2 py-3 text-2xl font-bold text-secondary">Dukafiy</div>

      {/* Navigation */}
      <nav className="mt-4 space-y-1 flex-1 overflow-y-auto">
        {navItems.map(({ href, label, Icon }) => {
          const active = router.pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-[#D6FF00] hover:text-[#0F172A] ${
                active ? "bg-[#0F172A] text-[#D6FF00] font-medium" : ""
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Sign out */}
      {status === "authenticated" && (
        <div className="mt-2">
          <button
            className="w-full flex items-center justify-center px-4 rounded-md gap-2 bg-secondary text-primary py-2  font-semibold"
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
          >
            <Power className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      )}

      {status !== "authenticated" && (
        <div className="mt-auto px-2 py-2 text-sm text-muted-foreground">
          <Link className="underline" href="/auth/login">
            Sign in
          </Link>
        </div>
      )}
    </aside>
  );
}
