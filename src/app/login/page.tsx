'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from '@/components/login-form';
import { Loader2 } from 'lucide-react';

function LoginFormWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-slate-100 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center">
          <img
            src="https://qcqxcffgfdsqfrwwvabh.supabase.co/storage/v1/object/public/brand-assets/logo-blue-h.png"
            alt="Best of Goa"
            className="h-10 w-auto"
          />
        </Link>
        <LoginFormWithSuspense />
      </div>
    </div>
  );
}
