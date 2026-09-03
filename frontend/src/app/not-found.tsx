import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration matching the auth/setup theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-zinc-900 z-0" />
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-72 h-72 rounded-full bg-purple-500/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-zinc-800/80 border border-zinc-700/50 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-black/20">
          <FileQuestion className="w-10 h-10 text-blue-400" />
        </div>
        
        <h1 className="text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500 mb-4">
          404
        </h1>
        
        <h2 className="text-2xl font-semibold text-white mb-3">
          Page not found
        </h2>
        
        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
          The page you are looking for doesn't exist or has been moved. 
          Double-check the URL or head back to the dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button 
            asChild
            variant="outline" 
            className="flex-1 h-11 border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl backdrop-blur-sm"
          >
            <Link href="javascript:history.back()">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Link>
          </Button>
          <Button 
            asChild
            className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-blue-500/25 border-0"
          >
            <Link href="/dashboard">
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
