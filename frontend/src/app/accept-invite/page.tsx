"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLoader } from '@/components/ui/loader';

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation token.');
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    setError('');

    try {
      await api.post(`/team/accept-invite?token=${token}`);
      setSuccess(true);
      
      // Update active org if needed, or just redirect to dashboard
      // They can switch orgs in the dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation. It may have expired.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50/50 p-4">
      <Card className="w-full max-w-md shadow-lg border-zinc-200/60 animate-in zoom-in-95 duration-500">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Organization Invitation</CardTitle>
          <CardDescription className="text-base">
            You've been invited to join a team on billOS.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm font-medium text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md text-center">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-4 text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md text-center flex flex-col gap-2">
              <span className="text-lg">🎉</span>
              <span>Invitation accepted successfully!</span>
              <span className="text-emerald-600/80">Redirecting to your dashboard...</span>
            </div>
          )}

          {!error && !success && isAuthenticated && (
            <div className="text-center p-4 bg-zinc-50 border border-zinc-100 rounded-lg">
              <p className="text-sm text-zinc-600 mb-4">
                You are currently logged in. Click below to accept the invitation and join the organization.
              </p>
              <Button 
                onClick={handleAccept} 
                className="w-full" 
                size="lg"
                isLoading={accepting}
              >
                Accept Invitation
              </Button>
            </div>
          )}

          {!error && !success && !isAuthenticated && (
            <div className="flex flex-col gap-3">
              <div className="text-center text-sm text-muted-foreground mb-2">
                To accept this invitation, you need to be logged in.
              </div>
              <Button asChild size="lg" className="w-full">
                <Link href={`/login?returnUrl=/accept-invite?token=${token}`}>
                  Log In to Accept
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link href={`/register?returnUrl=/accept-invite?token=${token}`}>
                  Create Account
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t border-zinc-100 pt-6">
          <p className="text-xs text-muted-foreground text-center">
            Powered by billOS
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AcceptInviteContent />
    </Suspense>
  );
}
