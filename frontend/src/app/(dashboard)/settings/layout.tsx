import { ReactNode } from "react";
import Link from "next/link";
import { SettingsNav } from "@/components/settings/SettingsNav";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
        <aside className="w-full lg:w-64 shrink-0">
          <SettingsNav />
        </aside>
        <div className="flex-1 min-w-0 w-full max-w-5xl">{children}</div>
      </div>
    </div>
  );
}
