import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2 text-center text-gray-900 dark:text-white">Reset Password</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Send Reset Link
        </button>
      </form>
      <div className="mt-6 text-center text-sm">
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
