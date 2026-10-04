import { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { DocumentLayout, DocumentSection } from "@/features/marketing/components/document-layout";
import { DocumentHeading } from "@/features/marketing/components/document-heading";

export const metadata: Metadata = {
  title: `Terms of Service | ${siteConfig.name}`,
  description: "Terms of Service for BillOS",
};

export default function TermsOfServicePage() {
  const sections: DocumentSection[] = [
    { id: "acceptance", title: "1. Acceptance of Terms" },
    { id: "eligibility", title: "2. Eligibility" },
    { id: "accounts", title: "3. User Accounts" },
    { id: "subscriptions", title: "4. Subscription Plans" },
    { id: "payments", title: "5. Payments" },
    { id: "taxes", title: "6. Taxes" },
    { id: "acceptable-use", title: "7. Acceptable Use" },
    { id: "ai-features", title: "8. AI Features Disclaimer" },
    { id: "data-ownership", title: "9. Data Ownership" },
    { id: "intellectual-property", title: "10. Intellectual Property" },
    { id: "third-party", title: "11. Third-party Integrations" },
    { id: "service-availability", title: "12. Service Availability" },
    { id: "limitation-liability", title: "13. Limitation of Liability" },
    { id: "indemnification", title: "14. Indemnification" },
    { id: "suspension", title: "15. Suspension and Termination" },
    { id: "governing-law", title: "16. Governing Law" },
    { id: "changes", title: "17. Changes to Terms" },
    { id: "contact", title: "18. Contact Information" },
  ];

  return (
    <DocumentLayout
      title="Terms of Service"
      badgeText="Legal Information"
      lastUpdated="July 18, 2026"
      sections={sections}
    >
      <section className="mb-16">
        <DocumentHeading id="acceptance">1. Acceptance of Terms</DocumentHeading>
        <p className="mb-4">
          By accessing or using the services provided by {siteConfig.name} (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use our software or platform.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="eligibility">2. Eligibility</DocumentHeading>
        <p className="mb-4">
          You must be at least 18 years old and capable of forming a binding contract to use {siteConfig.name}. If you are using the service on behalf of a company, organization, or other legal entity, you represent and warrant that you have the authority to bind that entity to these Terms.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="accounts">3. User Accounts</DocumentHeading>
        <p className="mb-4">
          To access most features, you must register for an account. You agree to provide accurate, complete, and current information during registration. You are responsible for safeguarding your password and for all activities that occur under your account. You must notify us immediately of any unauthorized use or security breaches.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="subscriptions">4. Subscription Plans</DocumentHeading>
        <p className="mb-4">
          Our services are offered on a subscription basis. By selecting a subscription plan, you agree to pay all applicable fees in accordance with the pricing terms in effect at the time of purchase. We reserve the right to change our pricing upon reasonable notice, which will apply to your next billing cycle.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="payments">5. Payments</DocumentHeading>
        <p className="mb-4">
          Payments are processed through secure third-party payment gateways. By providing payment information, you authorize us to charge your selected payment method on a recurring basis. Failure to pay may result in immediate suspension or termination of your account.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="taxes">6. Taxes</DocumentHeading>
        <p className="mb-4">
          You are responsible for all applicable taxes, levies, or duties imposed by taxing authorities related to your subscription (excluding taxes based on our net income). For businesses in India, applicable GST will be added to the invoice based on your registered location.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="acceptable-use">7. Acceptable Use</DocumentHeading>
        <p className="mb-4">
          You agree not to misuse {siteConfig.name}. This includes, but is not limited to:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Using the service for any illegal or unauthorized purpose.</li>
          <li>Attempting to hack, destabilize, or adapt the service.</li>
          <li>Transmitting malicious code, viruses, or destructive software.</li>
          <li>Uploading fraudulent financial records or engaging in tax evasion.</li>
          <li>Reselling or white-labeling the software without our explicit permission.</li>
        </ul>
      </section>

      <section className="mb-16">
        <DocumentHeading id="ai-features">8. AI Features Disclaimer</DocumentHeading>
        <p className="mb-4">
          {siteConfig.name} utilizes artificial intelligence to assist with data entry, categorization, and reporting. While we strive for accuracy, AI-generated insights are provided &quot;as-is&quot; and do not constitute professional accounting, financial, or legal advice. You remain solely responsible for reviewing and verifying the accuracy of all invoices, reports, and tax filings generated through our platform.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="data-ownership">9. Data Ownership</DocumentHeading>
        <p className="mb-4">
          You retain complete ownership of all business data, invoices, and files you upload to the platform. You grant us a limited, worldwide, non-exclusive license to host, process, and display this data strictly for the purpose of providing the service to you.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="intellectual-property">10. Intellectual Property</DocumentHeading>
        <p className="mb-4">
          All rights, title, and interest in and to the {siteConfig.name} platform (including its code, design, features, and AI models) remain the exclusive property of {siteConfig.company.name || "our company"}. You are granted a limited, non-transferable license to use the software during your active subscription.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="third-party">11. Third-party Integrations</DocumentHeading>
        <p className="mb-4">
          Our service may connect with third-party software (e.g., banks, CRMs, tax portals). We do not control and are not responsible for the functionality, privacy practices, or downtime of these external services. Your use of third-party integrations is governed by their respective terms.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="service-availability">12. Service Availability</DocumentHeading>
        <p className="mb-4">
          We strive for maximum uptime, but we do not guarantee uninterrupted availability. The service may be temporarily suspended for scheduled maintenance, updates, or emergencies. We will make reasonable efforts to notify users in advance of planned downtime.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="limitation-liability">13. Limitation of Liability</DocumentHeading>
        <p className="mb-4">
          To the maximum extent permitted by law, {siteConfig.company.name || siteConfig.name} and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of your use or inability to use the service.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="indemnification">14. Indemnification</DocumentHeading>
        <p className="mb-4">
          You agree to defend, indemnify, and hold harmless {siteConfig.name}, its officers, and employees from any claims, damages, or legal fees arising from your breach of these Terms, your violation of any laws (including tax laws), or your misuse of the platform.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="suspension">15. Suspension and Termination</DocumentHeading>
        <p className="mb-4">
          We reserve the right to suspend or terminate your account at any time, with or without cause, including for non-payment or violation of these Terms. Upon termination, your right to use the service will immediately cease, and you must export your data before the termination date.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="governing-law">16. Governing Law</DocumentHeading>
        <p className="mb-4">
          These Terms shall be governed by and construed in accordance with the laws of {siteConfig.company.registeredAddress ? "the jurisdiction where our company is registered" : "the applicable jurisdiction"}, without regard to its conflict of law provisions. Any legal action or proceeding shall be brought exclusively in the competent courts of our registered jurisdiction.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="changes">17. Changes to Terms</DocumentHeading>
        <p className="mb-4">
          We reserve the right to modify these Terms at our discretion. If a revision is material, we will provide at least 30 days&apos; notice prior to any new terms taking effect. By continuing to access the service after revisions become effective, you agree to be bound by the revised terms.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="contact">18. Contact Information</DocumentHeading>
        <p className="mb-4">If you have any questions regarding these Terms of Service, please contact us:</p>
        <ul className="mb-4 list-none divide-y divide-border rounded-[14px] border border-border bg-card px-6 pl-6 [&>li]:py-3.5 [&>li+li]:mt-0">
          {siteConfig.company.name ? <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"><span className="text-muted-foreground w-36">Company:</span> <strong className="text-foreground">{siteConfig.company.name}</strong></li> : null}
          {siteConfig.company.registeredAddress ? <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"><span className="text-muted-foreground w-36">Address:</span> <strong className="text-foreground">{siteConfig.company.registeredAddress}</strong></li> : null}
          {siteConfig.company.supportEmail ? <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"><span className="text-muted-foreground w-36">Email (Support):</span> <a href={`mailto:${siteConfig.company.supportEmail.replace(/[\[\]]/g, '')}`} className="font-medium">{siteConfig.company.supportEmail}</a></li> : null}
          {siteConfig.company.privacyEmail ? <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"><span className="text-muted-foreground w-36">Email (Privacy):</span> <a href={`mailto:${siteConfig.company.privacyEmail.replace(/[\[\]]/g, '')}`} className="font-medium">{siteConfig.company.privacyEmail}</a></li> : null}
          {siteConfig.company.phone ? <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"><span className="text-muted-foreground w-36">Phone:</span> <strong className="text-foreground">{siteConfig.company.phone}</strong></li> : null}
          {siteConfig.company.gstNumber ? <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"><span className="text-muted-foreground w-36">GSTIN:</span> <strong className="text-foreground">{siteConfig.company.gstNumber}</strong></li> : null}
          {siteConfig.company.cin ? <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"><span className="text-muted-foreground w-36">CIN:</span> <strong className="text-foreground">{siteConfig.company.cin}</strong></li> : null}
        </ul>
      </section>
    </DocumentLayout>
  );
}
