import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { footerNav } from "../content/navigation";
import { Container } from "./primitives/layout";
import { Logo } from "./primitives/logo";

export function SiteFooter() {
  const { company } = siteConfig;
  const phoneHref = company.phone ? `tel:${company.phone.replace(/[^0-9+]/g, "")}` : null;

  return (
    <footer className="border-t border-border bg-background">
      <Container className="grid gap-12 py-16 md:grid-cols-12 md:gap-8 lg:py-20">
        <div className="md:col-span-5">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            GST billing, stock, collections and reports for Indian businesses — in one set of books.
          </p>
          <address className="mt-6 space-y-1.5 text-sm not-italic text-muted-foreground">
            {company.businessEmail && (
              <a
                href={`mailto:${company.businessEmail}`}
                className="block w-fit rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {company.businessEmail}
              </a>
            )}
            {phoneHref && (
              <a
                href={phoneHref}
                className="block w-fit rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {company.phone}
              </a>
            )}
          </address>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
          {footerNav.map((group) => (
            <div key={group.title}>
              <h2 className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-subtle">{group.title}</h2>
              <ul className="mt-4 space-y-1">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      prefetch={false}
                      className="inline-flex min-h-8 items-center rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </Container>

      <div className="border-t border-border">
        <Container className="flex flex-col gap-2 py-6 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {company.name} All rights reserved.
          </p>
          <p>Made in {company.registeredAddress.split(",")[0]}, India</p>
        </Container>
      </div>
    </footer>
  );
}
