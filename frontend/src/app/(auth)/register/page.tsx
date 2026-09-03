"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
          }
        }
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      // If email confirmation is required, session will be null
      if (data.user && !data.session) {
        setSuccess(true);
      } else {
        // Auto-logged in (email confirmation disabled)
        if (returnUrl) {
          router.push(returnUrl);
        } else {
          router.push('/setup');
        }
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We've sent a verification link to <strong>{formData.email}</strong>.
            Please verify your email address to activate your account.
          </p>
        </div>
        <Button variant="outline" className="w-full h-10 mt-2" onClick={() => router.push('/login')}>
          Return to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col gap-2 text-center lg:text-left">
        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your details below to get started.
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm font-medium text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              placeholder="John"
              className="h-10"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Doe"
              className="h-10"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="name@example.com"
            className="h-10"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            pattern="^\+\d{1,4} \d{4,14}$"
            title="Format: Country Code + Phone (e.g. +91 9876543210)"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+91 9876543210"
            className="h-10"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className="h-10"
          />
        </div>

        <Button type="submit" className="w-full h-10 mt-2" isLoading={loading}>
          Sign Up
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground mt-2">
        Already have an account?{" "}
        <Link href={`/login${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`} className="font-semibold text-primary hover:underline underline-offset-4 transition-all">
          Sign in
        </Link>
      </div>
    </div>
  );
}
