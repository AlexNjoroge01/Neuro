import { Bell, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";


export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="w-full bg-background border-b border-gray-200/20 p-4 flex justify-between items-center shadow-md">
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-gray-100/10 border border-gray-200/20 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>
      {status === "authenticated" && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground truncate">{session.user?.email}</span>
          <Bell className="h-5 w-5 text-muted-foreground cursor-pointer" />
          <Image
            src="/user.png.jpg"
            alt="User profile"
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
        </div>
      )}
    </nav>
  );
}