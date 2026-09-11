import { ReactNode } from "react";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="w-full max-w-5xl mx-auto">{children}</div>
    </div>
  );
}
