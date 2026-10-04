import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { CtaBand } from "@/features/marketing/components/cta-band";
import { DocumentFlow } from "@/features/marketing/components/home/document-flow";
import { GstDetails } from "@/features/marketing/components/home/gst-details";
import { Hero } from "@/features/marketing/components/home/hero";
import { HomeFaq } from "@/features/marketing/components/home/home-faq";
import { PricingPreview } from "@/features/marketing/components/home/pricing-preview";
import { ProductTour } from "@/features/marketing/components/home/product-tour";
import { Testimonials } from "@/features/marketing/components/home/testimonials";
import { Trust } from "@/features/marketing/components/home/trust";

export const metadata: Metadata = {
  title: `${siteConfig.name} — GST billing, stock and accounts for Indian businesses`,
  description:
    "Raise GST invoices, track stock across warehouses, collect payments in the field and keep GSTR-1 and 3B ready for your CA — in one set of books.",
};

export default function Home() {
  return (
    <>
      <Hero />
      <DocumentFlow />
      <ProductTour />
      <GstDetails />
      <Trust />
      <Testimonials />
      <PricingPreview />
      <HomeFaq />
      <CtaBand />
    </>
  );
}
