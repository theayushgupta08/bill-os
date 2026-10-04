import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/lib/config";
import { ContactForm } from "@/features/marketing/components/contact-form";
import { PageIntro } from "@/features/marketing/components/page-intro";
import { Container, Section } from "@/features/marketing/components/primitives/layout";

export const metadata: Metadata = {
  title: `Contact | ${siteConfig.name}`,
  description: `Questions about ${siteConfig.name}'s features, pricing or moving your data? Talk to the team.`,
};

export default function ContactPage() {
  const { company } = siteConfig;
  const channels = [
    company.businessEmail && {
      icon: Mail,
      label: "Email",
      value: company.businessEmail,
      href: `mailto:${company.businessEmail}`,
    },
    company.phone && {
      icon: Phone,
      label: "Phone",
      value: company.phone,
      href: `tel:${company.phone.replace(/[^0-9+]/g, "")}`,
    },
    company.registeredAddress && { icon: MapPin, label: "Office", value: company.registeredAddress },
    company.businessHours && { icon: Clock, label: "Hours", value: company.businessHours },
  ].filter((channel) => !!channel);

  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="Talk to a person."
        lead="Questions about features, pricing or moving your data across? Write to us and someone from the team will reply during business hours."
      />

      <Section>
        <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <ContactForm />
          </div>

          <aside aria-labelledby="direct-title" className="lg:col-span-4 lg:col-start-9">
            <h2 id="direct-title" className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-subtle">
              Or reach us directly
            </h2>
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {channels.map(({ icon: Icon, label, value, href }) => (
                <li key={label} className="flex gap-4 py-5">
                  <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-link" strokeWidth={1.75} />
                  <div className="min-w-0">
                    <p className="text-sm text-subtle">{label}</p>
                    {href ? (
                      <a
                        href={href}
                        className="mt-0.5 inline-block rounded-sm font-medium break-words text-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="mt-0.5 text-foreground">{value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </Container>
      </Section>
    </>
  );
}
