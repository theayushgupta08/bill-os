import { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { DocumentLayout, DocumentSection } from "@/features/marketing/components/document-layout";
import { DocumentHeading } from "@/features/marketing/components/document-heading";

export const metadata: Metadata = {
  title: `Refund & Cancellation Policy | ${siteConfig.name}`,
  description: "Refund and Cancellation Policy for BillOS",
};

export default function RefundPolicyPage() {
  const sections: DocumentSection[] = [
    { id: "cancellation", title: "1. Subscription Cancellation" },
    { id: "refund-eligibility", title: "2. Refund Eligibility" },
    { id: "trial-period", title: "3. Trial Period" },
    { id: "monthly-plans", title: "4. Monthly Plans" },
    { id: "annual-plans", title: "5. Annual Plans" },
    { id: "failed-payments", title: "6. Failed Payments" },
    { id: "upgrades-downgrades", title: "7. Upgrades & Downgrades" },
    { id: "taxes", title: "8. Taxes" },
    { id: "exceptions", title: "9. Exceptions" },
    { id: "contact", title: "10. Contact Support" },
  ];

  return (
    <DocumentLayout
      title="Refund & Cancellation Policy"
      badgeText="Legal Information"
      lastUpdated="July 18, 2026"
      sections={sections}
    >
      <section className="mb-16">
        <DocumentHeading id="cancellation">1. Subscription Cancellation</DocumentHeading>
        <p className="mb-4">
          You may cancel your {siteConfig.name} subscription at any time through your account settings dashboard or by contacting our support team. Upon cancellation, your account will remain active until the end of your current billing cycle. We do not charge cancellation fees.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="refund-eligibility">2. Refund Eligibility</DocumentHeading>
        <p className="mb-4">
          Refunds are not guaranteed and are evaluated on a case-by-case basis in accordance with the terms outlined below. If you believe you were charged in error, you must contact support within <strong className="text-foreground">{siteConfig.policies.refundRequestWindowDays}</strong> days of the charge to be considered for a refund.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="trial-period">3. Trial Period</DocumentHeading>
        <p className="mb-4">
          We may offer a <strong className="text-foreground">{siteConfig.policies.freeTrialDays}</strong>-day free trial for new users. During the trial period, you will not be charged. If you do not cancel before the trial expires, you will automatically be billed for the subscription plan selected at sign-up. We do not provide refunds for charges incurred after a free trial period has concluded without cancellation.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="monthly-plans">4. Monthly Plans</DocumentHeading>
        <p className="mb-4">
          For monthly subscriptions, charges are non-refundable. If you cancel your monthly plan, you will retain access to {siteConfig.name} until the end of your current paid month. We do not provide prorated refunds for partial months of service.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="annual-plans">5. Annual Plans</DocumentHeading>
        <p className="mb-4">
          Annual subscriptions represent a significant discount in exchange for a one-year commitment. If you cancel an annual plan within the first <strong className="text-foreground">{siteConfig.policies.annualRefundWindowDays}</strong> days of purchase or renewal, you may be eligible for a prorated refund minus a processing fee. After this window, annual subscriptions are non-refundable, and your service will remain active until the end of the paid year.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="failed-payments">6. Failed Payments</DocumentHeading>
        <p className="mb-4">
          If your payment method fails, we will attempt to retry the charge over a period of <strong className="text-foreground">{siteConfig.policies.failedPaymentGracePeriodDays}</strong> days. During this grace period, your account access may be restricted. If the payment is not resolved within the grace period, your subscription will be paused or terminated. Failed payment retries do not constitute an error requiring a refund.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="upgrades-downgrades">7. Upgrades & Downgrades</DocumentHeading>
        <p className="mb-4">
          If you upgrade your subscription plan, you will be charged the prorated difference immediately, and your new plan features will be unlocked. If you downgrade your plan, the new lower rate will take effect at the start of your next billing cycle. We do not issue cash refunds or credits for downgrades made midway through a billing cycle.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="taxes">8. Taxes</DocumentHeading>
        <p className="mb-4">
          Any taxes (such as GST or VAT) collected at the time of purchase will only be refunded if a full refund of the underlying service is granted, and strictly subject to local tax laws. Prorated refunds may not include a refund of corresponding taxes depending on jurisdiction.
        </p>
      </section>

      <section className="mb-16">
        <DocumentHeading id="exceptions">9. Exceptions</DocumentHeading>
        <p className="mb-4">
          We may make exceptions to this policy and grant refunds in the following scenarios:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>Major service outages lasting more than <strong className="text-foreground">{siteConfig.policies.majorOutageHours}</strong> consecutive hours.</li>
          <li>Proven unauthorized access or fraudulent activity on your account.</li>
          <li>When required by local consumer protection laws governing your jurisdiction.</li>
        </ul>
      </section>

      <section className="mb-16">
        <DocumentHeading id="contact">10. Contact Support</DocumentHeading>
        <p className="mb-4">If you need to request a cancellation or believe you are entitled to a refund based on this policy, please reach out to our billing team:</p>
        <ul className="mb-4 list-none divide-y divide-border rounded-[14px] border border-border bg-card px-6 pl-6 [&>li]:py-3.5 [&>li+li]:mt-0">
          {siteConfig.company.name ? <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"><span className="text-muted-foreground w-36">Company:</span> <strong className="text-foreground">{siteConfig.company.name}</strong></li> : null}
          {siteConfig.company.supportEmail ? <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"><span className="text-muted-foreground w-36">Billing Support:</span> <a href={`mailto:${siteConfig.company.supportEmail.replace(/[\[\]]/g, '')}`} className="font-medium">{siteConfig.company.supportEmail}</a></li> : null}
          {siteConfig.company.phone ? <li className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"><span className="text-muted-foreground w-36">Phone:</span> <strong className="text-foreground">{siteConfig.company.phone}</strong></li> : null}
        </ul>
      </section>
    </DocumentLayout>
  );
}
