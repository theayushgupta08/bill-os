export const siteConfig = {
  name: "BillOS",
  tagline: "The Complete AI-Powered Business Operating System",
  description: "A modern cloud-based SaaS platform for small and medium businesses to manage GST billing, inventory, CRM, purchases, and more.",
  url: "https://billos.com", // Replace with actual URL
  logo: "/billos.png",
  links: {
    twitter: "https://twitter.com/billos", // Replace with actual Twitter
    github: "https://github.com/billos",
  },
  company: {
    name: "SHRIALOK AI LABS (OPC) Private Limited",
    registeredAddress: "New Calcutta Motors, Narmal Road, Khurrampur, Gorakhpur – 273001, Uttar Pradesh, India",
    city: "Gorakhpur",
    state: "Uttar Pradesh",
    supportEmail: "",
    privacyEmail: "",
    salesEmail: "",
    businessEmail: "hello@shrialok.co.in",
    phone: "+91 63914 19529",
    gstNumber: "",
    cin: "U62010UP2026OPC254455",
    businessHours: "Mon - Fri, 9:00 AM - 6:00 PM IST",
  },
  policies: {
    refundRequestWindowDays: "7",
    freeTrialDays: "14",
    annualRefundWindowDays: "7",
    failedPaymentGracePeriodDays: "7",
    majorOutageHours: "24",
  }
};

export type SiteConfig = typeof siteConfig;
