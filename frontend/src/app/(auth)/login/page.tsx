"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const urlError = searchParams.get('error');
  const verified = searchParams.get('verified') === 'true';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(urlError || '');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.type === 'email' ? 'email' : 'password']: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      // Check if user must change password on first login
      try {
        const mustChange = await api.get<{ mustChangePassword: boolean }>('/users/me/must-change-password');
        if (mustChange?.mustChangePassword) {
          router.push('/change-password');
          return;
        }
      } catch (checkErr) {
        console.warn('Could not check must-change-password status:', checkErr);
      }
      
      if (returnUrl) {
        router.push(returnUrl);
        return;
      }
      
      const orgs = await api.get<Array<{ id: string }>>('/organizations');
      
      if (orgs && orgs.length > 0) {
        localStorage.setItem('active_org_id', orgs[0].id);
        router.push('/dashboard');
      } else {
        router.push('/setup');
      }

    } catch (err: unknown) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
      const rawMsg = err instanceof Error ? err.message : 'Login failed';
      if (
        rawMsg.toLowerCase().includes('deactivated') ||
        rawMsg.toLowerCase().includes('banned') ||
        rawMsg.toLowerCase().includes('disabled')
      ) {
        setError('Your account has been deactivated. All active sessions have been revoked. Please contact your organization administrator.');
      } else {
        setError(rawMsg);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError('');
    
    try {
      const supabase = createClient();
      const redirectUrl = returnUrl 
        ? `${window.location.origin}/auth/callback?source=login&returnUrl=${encodeURIComponent(returnUrl)}`
        : `${window.location.origin}/auth/callback?source=login`;
        
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      
      if (error) throw error;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Google login failed';
      setError(errorMessage);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col gap-2 text-center lg:text-left">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your dashboard.
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm font-medium text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md text-center">
          {error}
        </div>
      )}

      {verified && !error && (
        <div className="p-3 text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md text-center">
          Email verified successfully. You can now log in.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="name@example.com"
            className="h-10"
          />
        </div>
        
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link 
              href="/forgot-password" 
              className="text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="h-10"
          />
        </div>

        <Button type="submit" className="w-full h-10 mt-2" isLoading={loading} disabled={isGoogleLoading}>
          Sign In
        </Button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-muted-foreground uppercase">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        type="button"
        disabled={loading || isGoogleLoading}
        onClick={handleGoogleLogin}
        className="w-full h-10 bg-background"
      >
        {isGoogleLoading ? (
          <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
        ) : (
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        Google
      </Button>

      <div className="text-center text-sm text-muted-foreground mt-2">
        Don&apos;t have an account?{" "}
        <Link href={`/register${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`} className="font-semibold text-primary hover:underline underline-offset-4 transition-all">
          Sign up
        </Link>
      </div>
    </div>
  );
}
