"use client";

import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  Percent,
  Receipt,
  FileText,
  Settings,
  ChevronRight,
  Shield,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const settingsSections = [
  {
    title: "Organization Profile",
    description: "Manage your business address, legal name, contact information, and logo.",
    href: "/settings/organization",
    icon: Building2,
    color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
    hoverBg: "hover:bg-indigo-500/10",
  },
  {
    title: "Team Management",
    description: "Invite team members, assign access roles (Admin, Manager, User), and manage permissions.",
    href: "/settings/team",
    icon: Users,
    color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    hoverBg: "hover:bg-emerald-500/10",
  },
  {
    title: "Tax Settings & Rates",
    description: "Configure default tax behaviors (e.g. inclusive pricing) and manage master tax rate codes.",
    href: "/settings/taxes",
    icon: Percent,
    color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    hoverBg: "hover:bg-amber-500/10",
  },
  {
    title: "Invoice & Billing Settings",
    description: "Customize invoice number prefixes, numbering formats, custom bank details, and payment terms.",
    href: "/settings/invoice",
    icon: FileText,
    color: "text-violet-400 border-violet-500/20 bg-violet-500/5",
    hoverBg: "hover:bg-violet-500/10",
  },
  {
    title: "Preferences",
    description: "Configure date formats, default currencies, system languages, and dark/light UI themes.",
    href: "/settings/preferences",
    icon: Settings,
    color: "text-slate-400 border-slate-500/20 bg-slate-500/5",
    hoverBg: "hover:bg-slate-500/10",
  },
];

export default function SettingsOverviewPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Configure organization settings, team members, taxation, invoicing, and preferences.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.title}
              onClick={() => router.push(section.href)}
              className={`group border border-border/60 cursor-pointer ${section.hoverBg} transition-all duration-200 shadow-sm`}
            >
              <CardHeader className="flex flex-row gap-4 items-start pb-4">
                <div className={`p-3 rounded-xl flex-shrink-0 flex items-center justify-center border ${section.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold group-hover:text-indigo-400 transition-colors">
                      {section.title}
                    </CardTitle>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-all duration-200 transform group-hover:translate-x-1" />
                  </div>
                  <CardDescription className="text-xs text-slate-400 leading-relaxed pt-1">
                    {section.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
