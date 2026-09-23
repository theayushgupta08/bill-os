import { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { DocumentLayout, DocumentSection } from "@/components/layout/DocumentLayout";
import { DocumentHeading } from "@/components/layout/DocumentHeading";

export const metadata: Metadata = {
  title: `Privacy Policy | ${siteConfig.name}`,
  description: "Privacy Policy for BillOS",
};

export default function PrivacyPolicyPage() {
  const sections: DocumentSection[] = [
    { id: "introduction", title: "1. Introduction" },
    { id: "information-we-collect", title: "2. Information We Collect" },
    { id: "how-we-use-information", title: "3. How We Use Information" },
    { id: "ai-processing", title: "4. AI Processing Disclosure" },
    { id: "data-storage", title: "5. Data Storage" },
    { id: "data-security", title: "6. Data Security" },
    { id: "third-party-services", title: "7. Third-party Services" },
    { id: "cookies", title: "8. Cookies" },
    { id: "user-rights", title: "9. User Rights" },
    { id: "data-retention", title: "10. Data Retention" },
    { id: "childrens-privacy", title: "11. Children's Privacy" },
    { id: "international-transfers", title: "12. International Data Transfers" },
    { id: "account-deletion", title: "13. Account Deletion" },
    { id: "changes-to-policy", title: "14. Changes to this Policy" },
    { id: "contact", title: "15. Contact Information" },
  ];

  return (
    <DocumentLayout
      title="Privacy Policy"
      badgeText="Legal Information"
      lastUpdated="July 18, 2026"
      sections={sections}
    >
      <section className="mb-16">
        <DocumentHeading id="introduction">1. Introduction</DocumentHeading>
        <p className="mb-4">
          Welcome to {siteConfig.name}. We respect your privacy and are committed to protecting your personal data. 
          This Privacy Policy explains how we collect, use, and safeguard your information when you use our SaaS platform.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="information-we-collect">2. Information We Collect</DocumentHeading>
        <p className="mb-4">We collect several different types of information for various purposes to provide and improve our service to you:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li><strong>Account information:</strong> Name, email, password, and phone number.</li>
          <li><strong>Business information:</strong> Company name, address, GST details, and CIN.</li>
          <li><strong>Billing information:</strong> Credit card details, billing address (processed via secure third-party gateways).</li>
          <li><strong>Uploaded files/documents:</strong> Invoices, receipts, and inventory records.</li>
          <li><strong>Usage analytics:</strong> How you interact with our application.</li>
          <li><strong>Device/browser information:</strong> IP address, browser type, and operating system.</li>
        </ul>
      </section>

      <section className="mb-16">
        <DocumentHeading id="how-we-use-information">3. How We Use Information</DocumentHeading>
        <p className="mb-4">We use the collected data for various purposes:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>To provide and maintain our Service.</li>
          <li>To notify you about changes to our Service.</li>
          <li>To provide customer support.</li>
          <li>To gather analysis or valuable information so that we can improve our Service.</li>
          <li>To process billing and payments.</li>
        </ul>
      </section>

      <section className="mb-16">
        <DocumentHeading id="ai-processing">4. AI Processing Disclosure</DocumentHeading>
        <p className="mb-4">
          {siteConfig.name} utilizes Artificial Intelligence to automate data entry and provide business insights. 
          Your business data may be processed by our AI models. However, we do <strong>not</strong> use your private financial 
          data to train public foundational models. All AI processing is isolated to your specific tenant account.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="data-storage">5. Data Storage</DocumentHeading>
        <p className="mb-4">
          Your data is stored securely on cloud servers provided by industry-leading infrastructure partners. 
          We employ logical isolation to ensure your data is strictly separated from other tenants.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="data-security">6. Data Security</DocumentHeading>
        <p className="mb-4">
          The security of your data is important to us. We use AES-256 encryption for data at rest and TLS 1.2+ for data in transit. 
          However, remember that no method of transmission over the Internet, or method of electronic storage is 100% secure.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="third-party-services">7. Third-party Services</DocumentHeading>
        <p className="mb-4">
          We may employ third-party companies and individuals to facilitate our Service, provide the Service on our behalf, 
          perform Service-related services, or assist us in analyzing how our Service is used. These third parties have access 
          to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="cookies">8. Cookies</DocumentHeading>
        <p className="mb-4">
          We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. 
          You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="user-rights">9. User Rights</DocumentHeading>
        <p className="mb-4">Depending on your location, you may have the right to:</p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Access the personal data we hold about you.</li>
          <li>Request correction of inaccurate data.</li>
          <li>Request deletion of your data.</li>
          <li>Object to our processing of your data.</li>
        </ul>
      </section>

      <section className="mb-16">
        <DocumentHeading id="data-retention">10. Data Retention</DocumentHeading>
        <p className="mb-4">
          We will retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. 
          Financial records may be retained longer to comply with legal and tax obligations.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="childrens-privacy">11. Children&apos;s Privacy</DocumentHeading>
        <p className="mb-4">
          Our Service does not address anyone under the age of 18. We do not knowingly collect personally identifiable information 
          from anyone under the age of 18.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="international-transfers">12. International Data Transfers</DocumentHeading>
        <p className="mb-4">
          Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your 
          state, province, country, or other governmental jurisdiction where the data protection laws may differ than those from your jurisdiction.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="account-deletion">13. Account Deletion</DocumentHeading>
        <p className="mb-4">
          You may request the deletion of your account and associated data by contacting our support team or navigating to your account settings. 
          Upon deletion, your data will be permanently removed from our active databases, subject to our backup retention policies.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="changes-to-policy">14. Changes to this Policy</DocumentHeading>
        <p className="mb-4">
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page 
          and updating the &quot;Last Updated&quot; date at the top of this Privacy Policy.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="contact">15. Contact Information</DocumentHeading>
        <p className="mb-4">If you have any questions about this Privacy Policy, please contact us:</p>
        <ul className="not-prose list-none space-y-4 mb-4 bg-gradient-to-br from-muted/50 to-transparent dark:from-white/5 dark:to-transparent p-8 rounded-2xl border border-border/50 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          {siteConfig.company.name ? <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"><span className="text-muted-foreground w-36">Company:</span> <strong className="text-foreground text-lg">{siteConfig.company.name}</strong></li> : null}
          {siteConfig.company.registeredAddress ? <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"><span className="text-muted-foreground w-36">Address:</span> <strong className="text-foreground">{siteConfig.company.registeredAddress}</strong></li> : null}
          {siteConfig.company.privacyEmail ? <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"><span className="text-muted-foreground w-36">Email (Privacy):</span> <a href={`mailto:${siteConfig.company.privacyEmail.replace(/[\[\]]/g, '')}`} className="text-primary hover:underline font-semibold">{siteConfig.company.privacyEmail}</a></li> : null}
          {siteConfig.company.phone ? <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"><span className="text-muted-foreground w-36">Phone:</span> <strong className="text-foreground">{siteConfig.company.phone}</strong></li> : null}
        </ul>
      </section>
    </DocumentLayout>
  );
}
