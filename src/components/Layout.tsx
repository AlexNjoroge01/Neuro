import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Package,
  Users,
  Boxes,
  BarChart3,
  Settings,
} from "lucide-react";
import { PropsWithChildren } from "react";
import { signOut, useSession } from "next-auth/react";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/products", label: "Products", Icon: Package },
  { href: "/customers", label: "Customers", Icon: Users },
  { href: "/inventory", label: "Inventory", Icon: Boxes },
  { href: "/reports", label: "Reports", Icon: BarChart3 },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export default function SidebarLayout({ children }: PropsWithChildren<{}>) {
  const router = useRouter();
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 border-r border-gray-200/20 p-4 hidden md:block">
        <div className="px-2 py-3 text-xl font-semibold">Neuro POS</div>
        <div className="px-2 py-2 text-sm text-muted-foreground">
          {status === "authenticated" ? (
            <div className="space-y-1">
              <div className="truncate">{session.user?.email}</div>
              <button className="text-red-500 underline" onClick={() => signOut({ callbackUrl: "/auth/login" })}>Sign out</button>
            </div>
          ) : (
            <Link className="underline" href="/auth/login">Sign in</Link>
          )}
        </div>
        <nav className="mt-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = router.pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100/10 ${
                  active ? "bg-gray-100/10 font-medium" : ""
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}


