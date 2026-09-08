"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Building2, Users, Percent, FileText, Settings } from "lucide-react";

const sidebarNavItems = [
  {
    title: "Organization Profile",
    href: "/settings/organization",
    icon: Building2,
  },
  {
    title: "Team Management",
    href: "/settings/team",
    icon: Users,
  },
  {
    title: "Tax Settings",
    href: "/settings/taxes",
    icon: Percent,
  },
  {
    title: "Invoice Settings",
    href: "/settings/invoice",
    icon: FileText,
  },
  {
    title: "Preferences",
    href: "/settings/preferences",
    icon: Settings,
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-1 overflow-x-auto lg:flex-col lg:space-x-0 lg:space-y-1">
      {sidebarNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              isActive
                ? "bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20 hover:bg-indigo-500/15"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent",
              "justify-start gap-2.5 rounded-lg px-3 py-2 transition-all duration-150 h-10 w-full whitespace-nowrap"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-400" : "text-slate-500")} />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
