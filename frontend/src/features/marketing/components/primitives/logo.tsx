import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

/** Brand mark + wordmark. "OS" picks up the brand colour, as in the full logo. */
export function Logo({ className }: { className?: string }) {
  const name = siteConfig.name;
  const split = name.endsWith("OS") ? name.length - 2 : name.length;
  return (
    <Link
      href="/"
      prefetch={false}
      aria-label={`${name} home`}
      className={cn(
        "-m-1 inline-flex items-center gap-2.5 rounded-md p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className
      )}
    >
      <Image src="/billos-mark.png" alt="" width={28} height={28} priority />
      <span className="text-[1.0625rem] font-semibold tracking-[-0.015em] text-foreground">
        {name.slice(0, split)}
        <span className="text-link">{name.slice(split)}</span>
      </span>
    </Link>
  );
}
