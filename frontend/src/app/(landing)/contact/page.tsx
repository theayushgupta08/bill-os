import { Metadata } from "next";
import { siteConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send,
  HelpCircle,
  MessageSquare
} from "lucide-react";

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
);
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: `Contact Us | ${siteConfig.name}`,
  description: "Get in touch with the BillOS team for support, sales, or general inquiries.",
};

export default function ContactPage() {
  return (
    <div className="relative overflow-hidden bg-background min-h-screen pb-24">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] opacity-20 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent blur-3xl"></div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
        
        {/* Header Section */}
        <div className="mb-20 md:text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6 backdrop-blur-sm">
            Get in Touch
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/70">
            Contact Our Team
          </h1>
          <p className="text-xl text-muted-foreground">
            Whether you have a question about features, trials, pricing, or anything else, our team is ready to answer all your questions.
          </p>
        </div>

        {/* Main Grid: Form & Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-24">
          
          {/* Contact Form */}
          <div className="bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 dark:border-white/5 rounded-3xl p-8 lg:p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
            
            <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-3">
              <MessageSquare className="text-primary w-6 h-6" /> Send us a message
            </h2>
            
            <form className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-foreground">First Name</label>
                  <Input id="firstName" placeholder="John" className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-foreground">Last Name</label>
                  <Input id="lastName" placeholder="Doe" className="bg-background/50" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">Work Email</label>
                <Input id="email" type="email" placeholder="john@company.com" className="bg-background/50" />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-foreground">Subject</label>
                <Input id="subject" placeholder="How can we help you?" className="bg-background/50" />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-foreground">Message</label>
                <Textarea 
                  id="message" 
                  placeholder="Tell us a little bit about your needs..." 
                  className="min-h-[150px] bg-background/50 resize-y" 
                />
              </div>
              
              <Button type="submit" className="w-full sm:w-auto mt-4 px-8 rounded-full">
                Send Message <Send className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-12">
            
            {/* Direct Contact Methods */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-foreground">Direct Contact</h3>
              <div className="space-y-6">
                
                {/* Emails */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-3">
                    {siteConfig.company.supportEmail && (
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Support</p>
                        <a href={`mailto:${siteConfig.company.supportEmail}`} className="text-foreground hover:text-primary transition-colors">
                          {siteConfig.company.supportEmail}
                        </a>
                      </div>
                    )}
                    {siteConfig.company.salesEmail && (
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Sales</p>
                        <a href={`mailto:${siteConfig.company.salesEmail}`} className="text-foreground hover:text-primary transition-colors">
                          {siteConfig.company.salesEmail}
                        </a>
                      </div>
                    )}
                    {siteConfig.company.businessEmail && (
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Business / Partners</p>
                        <a href={`mailto:${siteConfig.company.businessEmail}`} className="text-foreground hover:text-primary transition-colors">
                          {siteConfig.company.businessEmail}
                        </a>
                      </div>
                    )}
                    {(!siteConfig.company.supportEmail && !siteConfig.company.salesEmail && !siteConfig.company.businessEmail) && (
                      <p className="text-muted-foreground">
                        <a href={`mailto:${siteConfig.company.businessEmail}`} className="text-foreground hover:text-primary transition-colors">
                          {siteConfig.company.businessEmail}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                {siteConfig.company.phone && (
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Phone</p>
                      <a href={`tel:${siteConfig.company.phone.replace(/[^0-9+]/g, '')}`} className="text-foreground hover:text-primary transition-colors">
                        {siteConfig.company.phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Address */}
                {siteConfig.company.registeredAddress && (
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Office Address</p>
                      <p className="text-foreground">{siteConfig.company.registeredAddress}</p>
                    </div>
                  </div>
                )}

                {/* Business Hours */}
                {siteConfig.company.businessHours && (
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Business Hours</p>
                      <p className="text-foreground">{siteConfig.company.businessHours}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-foreground">Follow Us</h3>
              <div className="flex gap-4">
                <a href={siteConfig.links.twitter || "#"} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                  <TwitterIcon className="w-5 h-5" />
                </a>
                <a href="#" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                  <LinkedinIcon className="w-5 h-5" />
                </a>
                <a href={siteConfig.links.github || "#"} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all">
                  <GithubIcon className="w-5 h-5" />
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Map Placeholder Section */}
        <div className="mb-24">
          <div className="bg-muted rounded-3xl h-[400px] w-full flex flex-col items-center justify-center border border-border/50 text-muted-foreground shadow-inner relative overflow-hidden group">
            {/* Replace this div with actual iframe when ready */}
            <MapPin className="w-12 h-12 mb-4 opacity-50 group-hover:scale-110 transition-transform duration-500" />
            <h3 className="text-xl font-medium">Google Maps Integration</h3>
            <p className="text-sm mt-2 opacity-70">Replace this placeholder with your Google Maps embed iframe.</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Can't find the answer you're looking for? Reach out to our customer support team.</p>
          </div>

          <Accordion className="w-full">
            <AccordionItem value="item-1" className="border-b border-border/50 py-2">
              <AccordionTrigger className="text-left text-lg font-medium hover:text-primary hover:no-underline">
                How fast can I expect a response?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Our support team typically responds to all inquiries within 2-4 business hours during our standard operating times. Critical technical issues from premium plan users are prioritized and usually addressed within 1 hour.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border-b border-border/50 py-2">
              <AccordionTrigger className="text-left text-lg font-medium hover:text-primary hover:no-underline">
                Do you offer onboarding assistance?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Yes! We provide dedicated onboarding support for teams on our Pro and Enterprise plans. Our customer success team will help you migrate your data, set up your initial inventory, and train your staff.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border-b border-border/50 py-2">
              <AccordionTrigger className="text-left text-lg font-medium hover:text-primary hover:no-underline">
                Can I request custom features or integrations?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Absolutely. If you have specific requirements for your business, please reach out to our sales team. We offer custom API integrations and bespoke feature development as part of our Enterprise tier.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

      </div>
    </div>
  );
}
