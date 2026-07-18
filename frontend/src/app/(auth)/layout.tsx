import { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { siteConfig } from '@/lib/config';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex w-full">
      {/* Left Side: Premium Brand Area (Hidden on small screens) */}
      <div className="hidden lg:flex w-1/2 bg-zinc-900 flex-col relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-zinc-900 z-0"></div>
        <div className="absolute top-0 right-0 -mr-48 -mt-48 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-72 h-72 rounded-full bg-purple-500/20 blur-3xl"></div>

        {/* Content */}
        <div className="relative z-10 p-12 flex flex-col h-full justify-between">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <Image src={siteConfig.logo} alt="Logo" width={40} height={40} className="rounded-lg shadow-xl" />
              <span className="text-2xl font-bold text-white tracking-tight">{siteConfig.name}</span>
            </Link>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              Manage your business with intelligent simplicity.
            </h1>
            <p className="text-zinc-400 text-lg mb-8">
              Join thousands of businesses streamlining their billing, inventory, and GST compliance with our powerful AI assistant.
            </p>
            
            {/* Testimonial Quote */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <p className="text-zinc-300 italic mb-4">
                &quot;Switching to {siteConfig.name} was the best decision for our accounting. It feels like having a full-time CFO right in my browser.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                  AK
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Arjun Kapoor</p>
                  <p className="text-zinc-400 text-xs">Director, Nexus Traders</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: The Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-background relative">
        {/* Mobile Logo (visible only on small screens) */}
        <div className="absolute top-8 left-8 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Image src={siteConfig.logo} alt="Logo" width={32} height={32} className="rounded-md shadow-sm" />
            <span className="text-xl font-bold tracking-tight">{siteConfig.name}</span>
          </Link>
        </div>

        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
