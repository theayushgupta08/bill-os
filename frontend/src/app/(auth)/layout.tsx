import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        {/* Placeholder for Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">billOS</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Billing & Invoicing simplified
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
