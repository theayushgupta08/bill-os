"use client";

import { useState } from "react";
import { Tabs } from "@base-ui/react/tabs";
import * as m from "motion/react-m";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT } from "../../motion-tokens";
import { productModules, type ProductModule } from "../modules";
import { ArrowLink } from "../primitives/button-link";
import { Container, SectionHeading } from "../primitives/layout";
import { Reveal } from "../primitives/reveal";

/**
 * One tab per module. Base UI Tabs supplies the ARIA tabs pattern (arrow keys, Home/End, roving
 * tabindex); the indicator slides on CSS variables Base UI sets, so no layout animation is needed.
 */
export function ProductTour() {
  const [active, setActive] = useState<ProductModule["id"]>("billing");
  const [interacted, setInteracted] = useState(false);

  return (
    <section id="product" aria-labelledby="tour-title" className="bg-sunken py-20 sm:py-24 lg:py-32">
      <Container>
        <SectionHeading
          id="tour-title"
          eyebrow="The product"
          title="Everything your back office runs on."
          lead="Billing, stock, collections, reports and your team share one set of books — so every number agrees with every other number."
        />

        <Reveal className="mt-12 lg:mt-16">
          <Tabs.Root
            value={active}
            onValueChange={(value) => {
              setInteracted(true);
              setActive(value as ProductModule["id"]);
            }}
          >
            {/* Scrolls sideways on phones rather than wrapping into a ragged block */}
            <div className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
              <Tabs.List
                aria-label="Product areas"
                className="relative flex w-max min-w-full gap-1 border-b border-rule-strong"
              >
                {productModules.map((module) => (
                  <Tabs.Tab
                    key={module.id}
                    value={module.id}
                    className={cn(
                      "relative h-12 cursor-pointer rounded-t-md px-4 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors duration-150",
                      "hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                      "data-[active]:text-foreground"
                    )}
                  >
                    {module.tab}
                  </Tabs.Tab>
                ))}
                <Tabs.Indicator className="absolute -bottom-px left-[var(--active-tab-left)] h-0.5 w-[var(--active-tab-width)] rounded-full bg-primary transition-[left,width] duration-300 ease-ledger motion-reduce:transition-none" />
              </Tabs.List>
            </div>

            {productModules.map((module) => (
              <Tabs.Panel key={module.id} value={module.id} className="pt-10 outline-none lg:pt-14">
                <m.div
                  initial={interacted ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DURATION.base, ease: EASE_OUT }}
                  className="grid items-start gap-10 lg:min-h-[25rem] lg:grid-cols-12 lg:gap-12"
                >
                  <div className="lg:col-span-4 lg:pt-4">
                    <h3 className="font-display text-[1.75rem] leading-tight tracking-[-0.015em] text-balance text-foreground">
                      {module.title}
                    </h3>
                    <p className="mt-4 leading-relaxed text-muted-foreground">{module.summary}</p>
                    <ul className="mt-6 space-y-3">
                      {module.points.map((point) => (
                        <li key={point} className="flex gap-3 text-[0.9375rem] text-foreground">
                          <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-positive" />
                          {point}
                        </li>
                      ))}
                    </ul>
                    <ArrowLink href={`/features#${module.id}`} className="mt-7 text-[0.9375rem]">
                      More about {module.tab}
                    </ArrowLink>
                  </div>
                  <div className="lg:col-span-8">
                    <module.Panel />
                  </div>
                </m.div>
              </Tabs.Panel>
            ))}
          </Tabs.Root>
        </Reveal>
      </Container>
    </section>
  );
}
