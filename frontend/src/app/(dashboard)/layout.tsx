import { PropsWithChildren } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar: fixed width, full height */}
      <div className="hidden md:flex flex-col w-[220px] lg:w-[260px] flex-shrink-0 h-screen sticky top-0 overflow-hidden">
        <Sidebar />
      </div>
      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex flex-1 flex-col bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
