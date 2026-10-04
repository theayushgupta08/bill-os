import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { CtaBand } from "@/features/marketing/components/cta-band";
import { PageIntro } from "@/features/marketing/components/page-intro";
import { Container, Section, SectionHeading } from "@/features/marketing/components/primitives/layout";
import { Reveal } from "@/features/marketing/components/primitives/reveal";

export const metadata: Metadata = {
  title: `About | ${siteConfig.name}`,
  description: `Why ${siteConfig.name} exists, how we build it, and who we are.`,
};

const principles = [
  {
    title: "Accuracy before speed",
    body: "Speed matters, but a fast wrong number is worse than a slow right one. Totals are calculated on the server, tax is split to the paisa, and a tax rate used on an invoice can't be quietly re-priced later.",
  },
  {
    title: "Built for how Indian businesses work",
    body: "GST from the first line of code, amounts in lakhs and crores, cash collected in the field, branches that share a customer list. Not a foreign product with a GST plug-in.",
  },
  {
    title: "Plain language",
    body: "The people who run a business shouldn't need an accountant to use their own software. We write labels, errors and help for owners and their staff, not for ourselves.",
  },
  {
    title: "Honest about what's shipped",
    body: "If a feature isn't ready, we say so. Our pricing has no hidden fees, and our website describes the product you'll actually get.",
  },
];

export default function AboutPage() {
  const { company } = siteConfig;
  const facts = [
    { label: "Company", value: company.name },
    { label: "Based in", value: company.registeredAddress },
    { label: "Email", value: company.businessEmail, href: `mailto:${company.businessEmail}` },
    { label: "Hours", value: company.businessHours },
  ].filter((fact) => fact.value);

  return (
    <>
      <PageIntro
        eyebrow="About"
        title="We're building the back office Indian businesses deserve."
        lead={`${siteConfig.name} is made by ${company.name}, a team in ${company.registeredAddress.split(",")[0]} that believes running the books shouldn't take over running the business.`}
      />

      <Section aria-labelledby="story-title">
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <SectionHeading id="story-title" eyebrow="Why" title="Why we started." />
          </div>
          <div className="space-y-6 text-lg leading-relaxed text-muted-foreground lg:col-span-7">
            <p>
              {siteConfig.name} began with a familiar frustration. Most small businesses we met kept their sales in a
              billing app, their stock in a register, their dues in a notebook and their GST in a spreadsheet the
              accountant rebuilt every month. Every figure was typed at least twice, and the totals rarely agreed.
            </p>
            <p>
              The alternative was usually an ERP that took months to set up and a consultant to change. We think
              there&apos;s room in between: software that&apos;s quick to start with, strict where accounting has to
              be strict, and clear enough that the whole team can use it.
            </p>
            <p className="text-foreground">
              So we built one set of books where an invoice, the stock it moves, the payment that settles it and the
              return it appears on are all the same record.
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="sunken" aria-labelledby="principles-title">
        <Container>
          <SectionHeading id="principles-title" eyebrow="How we work" title="What we hold ourselves to." />
          <ol className="mt-12 grid gap-x-12 sm:grid-cols-2">
            {principles.map((principle, index) => (
              <li key={principle.title} className="border-t border-rule-strong">
                <Reveal delay={(index % 2) * 0.06} className="grid grid-cols-[2.5rem_1fr] gap-x-3 py-8">
                  <span className="pt-1 font-mono text-sm text-subtle">0{index + 1}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{principle.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted-foreground">{principle.body}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      <Section aria-labelledby="company-title">
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <SectionHeading id="company-title" eyebrow="Company" title="Who we are." />
          </div>
          <dl className="divide-y divide-border border-y border-border lg:col-span-7">
            {facts.map((fact) => (
              <div key={fact.label} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <dt className="text-sm text-subtle">{fact.label}</dt>
                <dd className="text-foreground">
                  {fact.href ? (
                    <a
                      href={fact.href}
                      className="rounded-sm text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      {fact.value}
                    </a>
                  ) : (
                    fact.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </Section>

      <CtaBand />
    </>
  );
}
