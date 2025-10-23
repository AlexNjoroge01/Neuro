import { PropsWithChildren } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function SidebarLayout({ children }: {children: PropsWithChildren<React.ReactNode>}) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-4 md:p-6 bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}