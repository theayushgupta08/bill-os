"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog } from "@base-ui/react/dialog";
import { AnimatePresence, useMotionValueEvent, useScroll } from "motion/react";
import * as m from "motion/react-m";
import { Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CURRENT_USER_KEY, useCurrentUser } from "@/lib/use-current-user";
import { cn } from "@/lib/utils";
import { primaryNav } from "../content/navigation";
import { fontDisplay } from "../fonts";
import { DURATION, EASE_OUT } from "../motion-tokens";
import { ButtonLink, buttonStyles } from "./primitives/button-link";
import { Container } from "./primitives/layout";
import { Logo } from "./primitives/logo";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const isSignedIn = !!currentUser;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // The bar is transparent over the hero and firms up (paper + hairline) once the page moves
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));

  useEffect(() => {
    // Drop any leftover token from the pre-Supabase auth flow so it doesn't pollute the browser
    localStorage.removeItem("token");

    // Sign-in/sign-out in this or another tab: refresh the cached user instead of tracking it by hand
    const {
      data: { subscription },
    } = createClient().auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-200 ease-ledger",
        scrolled || menuOpen
          ? "border-border bg-background/95 backdrop-blur-md"
          : "border-transparent bg-background/0"
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {primaryNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex h-9 items-center rounded-md px-3 text-sm font-medium transition-colors duration-150",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                    {active && (
                      <span aria-hidden className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-primary" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <ButtonLink href="/dashboard" size="sm" arrow className="hidden sm:inline-flex">
              Open dashboard
            </ButtonLink>
          ) : (
            <>
              <Link
                href="/login"
                prefetch={false}
                className={cn(buttonStyles({ variant: "ghost", size: "sm" }), "hidden lg:inline-flex")}
              >
                Log in
              </Link>
              <ButtonLink href="/register" size="sm" className="hidden sm:inline-flex">
                Start free trial
              </ButtonLink>
            </>
          )}

          <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Dialog.Trigger
              aria-label="Open menu"
              className={cn(buttonStyles({ variant: "ghost", size: "md" }), "-mr-2 w-11 px-0 lg:hidden")}
            >
              <Menu aria-hidden className="size-5" />
            </Dialog.Trigger>
            <MobileMenu
              open={menuOpen}
              pathname={pathname}
              isSignedIn={isSignedIn}
              onNavigate={() => setMenuOpen(false)}
            />
          </Dialog.Root>
        </div>
      </Container>
    </header>
  );
}

interface MobileMenuProps {
  open: boolean;
  pathname: string;
  isSignedIn: boolean;
  onNavigate: () => void;
}

/**
 * Full-height sheet that drops from the header. Base UI handles focus trapping, Escape, scroll lock
 * and returning focus to the trigger; Motion handles enter/exit (the portal stays mounted while the
 * exit animation runs). The portal renders outside the layout, so it re-applies `site-light` and the
 * display font variable itself.
 */
function MobileMenu({ open, pathname, isSignedIn, onNavigate }: MobileMenuProps) {
  return (
    <AnimatePresence>
      {open && (
        <Dialog.Portal keepMounted>
          <Dialog.Backdrop
            render={
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: DURATION.fast } }}
                transition={{ duration: DURATION.base, ease: EASE_OUT }}
              />
            }
            className="fixed inset-0 z-40 bg-[#0e1a33]/30 lg:hidden"
          />
          <Dialog.Popup
            render={
              <m.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: DURATION.fast } }}
                transition={{ duration: DURATION.base, ease: EASE_OUT }}
              />
            }
            className={cn(
              "site-light fixed inset-x-0 top-0 z-50 flex max-h-dvh flex-col overflow-y-auto border-b border-border pb-6 shadow-float lg:hidden",
              fontDisplay.variable
            )}
          >
            <Container className="flex h-16 shrink-0 items-center justify-between">
              <Logo />
              <Dialog.Close
                aria-label="Close menu"
                className={cn(buttonStyles({ variant: "ghost", size: "md" }), "-mr-2 w-11 px-0")}
              >
                <X aria-hidden className="size-5" />
              </Dialog.Close>
            </Container>
            <Dialog.Title className="sr-only">Menu</Dialog.Title>

            <Container>
              <nav aria-label="Main">
                <ul className="divide-y divide-border border-y border-border">
                  {primaryNav.map((item) => {
                    const active = isActive(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          prefetch={false}
                          onClick={onNavigate}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex min-h-14 items-center justify-between py-3 font-display text-2xl tracking-[-0.01em]",
                            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                            active ? "text-link" : "text-foreground"
                          )}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="mt-6 grid gap-3">
                {isSignedIn ? (
                  <ButtonLink href="/dashboard" size="lg" arrow onClick={onNavigate}>
                    Open dashboard
                  </ButtonLink>
                ) : (
                  <>
                    <ButtonLink href="/register" size="lg" onClick={onNavigate}>
                      Start free trial
                    </ButtonLink>
                    <ButtonLink href="/login" size="lg" variant="secondary" onClick={onNavigate}>
                      Log in
                    </ButtonLink>
                  </>
                )}
              </div>
            </Container>
          </Dialog.Popup>
        </Dialog.Portal>
      )}
    </AnimatePresence>
  );
}
