import { SiteHeader } from "@/components/landing/SiteHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProof } from "@/components/landing/SocialProof";
import { InteractiveShowcase } from "@/components/landing/InteractiveShowcase";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { AiAssistant } from "@/components/landing/AiAssistant";
import { WorkflowTimeline } from "@/components/landing/WorkflowTimeline";
import { IntegrationMarquee } from "@/components/landing/IntegrationMarquee";
import { PricingSection } from "@/components/landing/PricingSection";
import { Testimonials } from "@/components/landing/Testimonials";
import { SecurityFAQ } from "@/components/landing/SecurityFAQ";
import { FinalCta } from "@/components/landing/FinalCta";
import { SiteFooter } from "@/components/landing/SiteFooter";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <SocialProof />
        <InteractiveShowcase />
        <FeatureGrid />
        <AiAssistant />
        <WorkflowTimeline />
        <IntegrationMarquee />
        <Testimonials />
        <PricingSection />
        <SecurityFAQ />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
