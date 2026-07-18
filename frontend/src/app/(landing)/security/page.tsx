import { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { DocumentLayout, DocumentSection } from "@/components/layout/DocumentLayout";
import { DocumentHeading } from "@/components/layout/DocumentHeading";
import { 
  Shield, 
  Lock, 
  Key, 
  Database, 
  Server, 
  RefreshCcw, 
  AlertTriangle, 
  BrainCircuit,
  FileBadge
} from "lucide-react";

export const metadata: Metadata = {
  title: `Security & Privacy | ${siteConfig.name}`,
  description: "Learn how BillOS secures your financial and business data with enterprise-grade infrastructure.",
};

export default function SecurityPage() {
  const sections: DocumentSection[] = [
    { id: "data-protection", title: "1. Data Protection" },
    { id: "access-control", title: "2. Access Control" },
    { id: "multi-tenancy", title: "3. Multi-Tenancy & Isolation" },
    { id: "reliability", title: "4. Reliability & Recovery" },
    { id: "ai-privacy", title: "5. AI Data Privacy" },
    { id: "incident-response", title: "6. Incident Response" },
    { id: "compliance-target", title: "7. Compliance Target" },
  ];

  return (
    <DocumentLayout
      title="Enterprise-Grade Security"
      badgeText="Trust & Security"
      lastUpdated="July 18, 2026"
      sections={sections}
    >
      <section className="mb-16">
        <DocumentHeading id="data-protection">1. Data Protection</DocumentHeading>
        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl p-8 shadow-lg mt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" /> Encryption
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                All data sent to or from our infrastructure is encrypted in transit using TLS 1.2 or higher. Once stored, your data is encrypted at rest using industry-standard AES-256 encryption. We utilize strictly managed encryption keys that are rotated securely.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Password Security</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We never store passwords in plaintext. All user passwords are cryptographically hashed and salted using strong, memory-hard algorithms (such as Argon2 or bcrypt) before storage, protecting against brute-force and rainbow table attacks.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <DocumentHeading id="access-control">2. Access Control</DocumentHeading>
        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl p-8 shadow-lg mt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" /> Authentication
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Access to {siteConfig.name} is guarded by secure session management. We enforce modern authentication flows with secure, HTTP-only cookies and robust JWT validation to prevent session hijacking and cross-site scripting (XSS) attacks.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Authorization & RBAC</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We operate on a principle of least privilege. Our Role-Based Access Control (RBAC) ensures that users within your organization only have access to the specific resources and data necessary to perform their duties.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <DocumentHeading id="multi-tenancy">3. Multi-Tenancy & Isolation</DocumentHeading>
        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl p-8 shadow-lg mt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" /> Data Isolation
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our architecture is designed to enforce strict logical tenant isolation. Every database query is scoped specifically to the requesting tenant's unique identifier. This ensures that cross-tenant data leakage is fundamentally prevented at the application layer.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <DocumentHeading id="reliability">4. Reliability & Recovery</DocumentHeading>
        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl p-8 shadow-lg mt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" /> Infrastructure
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {siteConfig.name} is hosted on tier-1 cloud infrastructure providers. We deploy across highly available regions with automatic scaling capabilities to defend against DDoS attacks and ensure uptime during peak operational hours.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Backups & Disaster Recovery</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We perform continuous database replication and automated daily snapshots. In the event of a catastrophic failure, our Disaster Recovery (DR) protocols are designed to restore service and data swiftly, minimizing potential data loss windows.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <DocumentHeading id="ai-privacy">5. AI Data Privacy</DocumentHeading>
        <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-3xl p-8 relative overflow-hidden mt-6">
          <BrainCircuit className="w-8 h-8 text-primary mb-4" />
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            We believe in harnessing AI without compromising your intellectual property. Our stance is clear:
          </p>
          <ul className="space-y-3 text-sm text-foreground list-none pl-0">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
              <span>Your financial data is <strong>never</strong> used to train public foundational AI models.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
              <span>Machine learning processes on your data are strictly confined within our secure cloud perimeter.</span>
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
              <span>AI outputs generated for your account are private and inaccessible by other tenants.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="mb-16">
        <DocumentHeading id="incident-response">6. Incident Response</DocumentHeading>
        <div className="border border-border/50 bg-muted/30 rounded-3xl p-8 mt-6">
          <AlertTriangle className="w-8 h-8 text-foreground/70 mb-4" />
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Our engineering team maintains robust monitoring and alerting for all infrastructure anomalies. If a security incident occurs, we have an established Incident Response plan to rapidly detect, contain, and mitigate the threat, followed by transparent communication with affected users.
          </p>
          
          <div className="pt-4 mt-4 border-t border-border/50">
            <h4 className="font-semibold text-foreground mb-2">Responsible Disclosure</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you are a security researcher and believe you have found a vulnerability in {siteConfig.name}, please contact us directly at <a href={`mailto:${siteConfig.company.supportEmail}`} className="text-primary hover:underline">{siteConfig.company.supportEmail}</a> before making any public disclosure.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-16">
        <DocumentHeading id="compliance-target">7. Compliance Target</DocumentHeading>
        <div className="border border-border/50 bg-background rounded-3xl p-8 mt-6">
          <FileBadge className="w-8 h-8 text-foreground/70 mb-4" />
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            We are actively architecting our systems and internal policies to align with major global compliance frameworks. As we grow, we intend to formalize our posture with the following certifications:
          </p>
          <ul className="space-y-3 text-sm font-medium text-foreground list-none pl-0">
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-sm bg-muted-foreground/30"></span>
              [Placeholder: SOC2 Type II]
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-sm bg-muted-foreground/30"></span>
              [Placeholder: ISO 27001]
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-sm bg-muted-foreground/30"></span>
              [Placeholder: GDPR Compliance]
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-sm bg-muted-foreground/30"></span>
              [Placeholder: HIPAA Compliance]
            </li>
          </ul>
          <p className="text-xs text-muted-foreground mt-4 italic">
            * Note: The frameworks listed above represent our target compliance roadmap and are currently in the implementation phase.
          </p>
        </div>
      </section>
    </DocumentLayout>
  );
}
