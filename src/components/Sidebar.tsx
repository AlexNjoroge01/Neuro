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
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/products", label: "Products", Icon: Package },
  { href: "/inventory", label: "Inventory", Icon: Boxes },
  { href: "/sales", label: "POS", Icon: BarChart3 },
  { href: "/accounting", label: "Accounting", Icon: Wallet },
  { href: "/fleet", label: "Fleet", Icon: Truck },
  { href: "/hr", label: "HR & Payroll", Icon: UsersRound },
  { href: "/reports", label: "Reports", Icon: BarChart3 },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function Sidebar() {
  const router = useRouter();
  const { data: session, status } = useSession();

  return (
    <aside className="w-64 border-r border-gray-200/20 p-4 hidden md:block">
      <div className="px-2 py-3 text-xl font-semibold ">Smart ERP & POS System</div>
      <nav className="mt-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = router.pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#D6FF00] hover:text-[#0F172A] ${
                active ? "bg-[#0F172A] text-[#D6FF00] font-medium" : ""
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-8"></div> {/* Space between menu items and sign-out */}
      {status === "authenticated" && (
        <div className="flex justify-center">
          <button
            className="w-full bg-secondary text-secondary-foreground py-2 mt-16 rounded hover:bg-secondary/80"
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
          >
            Sign out
          </button>
        </div>
      )}
      {status !== "authenticated" && (
        <div className="mt-auto px-2 py-2 text-sm text-muted-foreground">
          <Link className="underline" href="/auth/login">Sign in</Link>
        </div>
      )}
    </aside>
  );
}