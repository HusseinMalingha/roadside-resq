"use client"; // Ensure this page and its children are treated as client-side for build

import { Suspense } from 'react';
import LoginClientPage from './login-client-page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic'; // Keep to emphasize dynamic nature

function LoginSkeleton() {
  return (
    <div className="flex-grow flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-3" />
          <CardTitle className="text-2xl md:text-3xl">Loading Login</CardTitle>
          <CardDescription>Please wait while we prepare the login page...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded w-full animate-pulse"></div>
            <div className="h-10 bg-muted rounded w-full animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPageContainer() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginClientPage />
    </Suspense>
  );
}
