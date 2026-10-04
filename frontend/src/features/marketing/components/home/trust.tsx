import { FileDown, History, KeyRound, Lock, ShieldCheck, UsersRound } from "lucide-react";
import { ArrowLink } from "../primitives/button-link";
import { Container, Section, SectionHeading } from "../primitives/layout";
import { Reveal } from "../primitives/reveal";

const points = [
  {
    icon: Lock,
    title: "Walled off by organisation",
    body: "Every query is scoped to your organisation. Branches see only what the parent chooses to share.",
  },
  {
    icon: UsersRound,
    title: "Roles that mean something",
    body: "Viewers can read but never change. Deleting needs a Manager; settings need an Admin.",
  },
  {
    icon: History,
    title: "A trail for every change",
    body: "Issued, edited, deleted — the audit log records who did what, and when.",
  },
  {
    icon: ShieldCheck,
    title: "Encrypted in transit and at rest",
    body: "Every request travels over TLS, and the database is encrypted at rest.",
  },
  {
    icon: KeyRound,
    title: "Sign in your way",
    body: "Email and password or Google. Temporary passwords must be changed on first sign-in.",
  },
  {
    icon: FileDown,
    title: "Documents you can take with you",
    body: "Invoices, quotations and purchase orders download as PDFs whenever you need them.",
  },
];

export function Trust() {
  return (
    <Section aria-labelledby="trust-title">
      <Container className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHeading
            id="trust-title"
            eyebrow="Trust"
            title="Your books stay yours."
            lead="Financial records deserve more than a promise. Here's what's in place today."
          />
          <ArrowLink href="/security" className="mt-8">
            How we protect your data
          </ArrowLink>
        </div>

        <ul className="grid gap-x-10 gap-y-2 sm:grid-cols-2 lg:col-span-8">
          {points.map(({ icon: Icon, title, body }, index) => (
            <li key={title} className="border-t border-border">
              <Reveal delay={(index % 2) * 0.06} className="py-6">
                <Icon aria-hidden className="size-5 text-link" strokeWidth={1.75} />
                <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 leading-relaxed text-muted-foreground">{body}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
