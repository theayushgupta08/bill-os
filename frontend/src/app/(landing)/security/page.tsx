import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { CtaBand } from "@/features/marketing/components/cta-band";
import { DocumentHeading } from "@/features/marketing/components/document-heading";
import { DocumentLayout, type DocumentSection } from "@/features/marketing/components/document-layout";

export const metadata: Metadata = {
  title: `Security & Privacy | ${siteConfig.name}`,
  description: "How BillOS protects your financial and business data.",
};

const sections: DocumentSection[] = [
  { id: "data-protection", title: "1. Data protection" },
  { id: "access-control", title: "2. Access control" },
  { id: "multi-tenancy", title: "3. Multi-tenancy & isolation" },
  { id: "reliability", title: "4. Reliability & recovery" },
  { id: "ai-privacy", title: "5. AI data privacy" },
  { id: "incident-response", title: "6. Incident response" },
  { id: "compliance-target", title: "7. Compliance roadmap" },
];

const disclosureEmail = siteConfig.company.supportEmail || siteConfig.company.businessEmail;

export default function SecurityPage() {
  return (
    <>
      <DocumentLayout
        title="How we keep your books safe"
        badgeText="Trust & Security"
        lastUpdated="July 18, 2026"
        sections={sections}
      >
        <section className="mb-14">
          <DocumentHeading id="data-protection">1. Data protection</DocumentHeading>
          <h3>Encryption</h3>
          <p>
            All data sent to or from our infrastructure is encrypted in transit using TLS 1.2 or higher. Once stored,
            your data is encrypted at rest using industry-standard AES-256 encryption, with strictly managed keys that
            are rotated securely.
          </p>
          <h3>Password security</h3>
          <p>
            We never store passwords in plaintext. Passwords are hashed and salted with a strong, slow algorithm before
            storage, protecting against brute-force and rainbow-table attacks.
          </p>
        </section>

        <section className="mb-14">
          <DocumentHeading id="access-control">2. Access control</DocumentHeading>
          <h3>Authentication</h3>
          <p>
            Access to {siteConfig.name} is guarded by secure session management. Every request to our API carries a
            signed token that is verified on the server before anything is read or written.
          </p>
          <h3>Authorisation and roles</h3>
          <p>
            We follow the principle of least privilege. Each person has a role in your organisation — Owner, Admin,
            Manager, User or Viewer — and every action checks it: viewers can read but not change, deleting needs a
            Manager, and settings need an Admin.
          </p>
        </section>

        <section className="mb-14">
          <DocumentHeading id="multi-tenancy">3. Multi-tenancy & isolation</DocumentHeading>
          <p>
            Every organisation&apos;s data is logically isolated. Each request is checked against your membership of
            the organisation it names, and every database query is scoped to that organisation — so one business can
            never read another&apos;s records.
          </p>
        </section>

        <section className="mb-14">
          <DocumentHeading id="reliability">4. Reliability & recovery</DocumentHeading>
          <h3>Infrastructure</h3>
          <p>
            {siteConfig.name} runs on established cloud infrastructure providers, deployed for availability and
            scaled to stay responsive during busy hours.
          </p>
          <h3>Backups & disaster recovery</h3>
          <p>
            We take automated daily database backups. If a serious failure occurs, our recovery procedures are designed
            to restore service and data quickly and keep any potential data loss to a minimum.
          </p>
        </section>

        <section className="mb-14">
          <DocumentHeading id="ai-privacy">5. AI data privacy</DocumentHeading>
          <p>We intend to use AI without compromising your business data. Our position is clear:</p>
          <ul>
            <li>
              Your financial data is <strong>never</strong> used to train public foundation models.
            </li>
            <li>Any machine-learning processing of your data stays within our secure cloud perimeter.</li>
            <li>AI output generated for your account is private to your organisation.</li>
          </ul>
        </section>

        <section className="mb-14">
          <DocumentHeading id="incident-response">6. Incident response</DocumentHeading>
          <p>
            We monitor our infrastructure for anomalies. If a security incident occurs, we follow an incident-response
            plan to detect, contain and fix it, and we communicate openly with affected customers.
          </p>
          <h3>Responsible disclosure</h3>
          <p>
            If you&apos;re a security researcher and believe you&apos;ve found a vulnerability in {siteConfig.name},
            please email <a href={`mailto:${disclosureEmail}`}>{disclosureEmail}</a> before disclosing it publicly.
          </p>
        </section>

        <section className="mb-4">
          <DocumentHeading id="compliance-target">7. Compliance roadmap</DocumentHeading>
          <p>
            We&apos;re building our systems and internal policies to align with recognised security frameworks, and
            intend to formalise that with the following certifications as we grow:
          </p>
          <ul>
            <li>SOC 2 Type II</li>
            <li>ISO/IEC 27001</li>
            <li>GDPR</li>
          </ul>
          <p className="text-sm text-subtle">
            These are targets on our roadmap and are not yet certified.
          </p>
        </section>
      </DocumentLayout>
      <CtaBand />
    </>
  );
}
