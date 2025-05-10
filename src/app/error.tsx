
'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in a real application
    console.error("Global Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 md:p-6">
      <Card className="w-full max-w-lg text-center shadow-xl">
        <CardHeader>
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <CardTitle className="text-2xl md:text-3xl">Oops! Something Went Wrong</CardTitle>
          <CardDescription className="text-sm md:text-base">
            We encountered an unexpected issue. This might be a temporary problem with our server or your internet connection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs md:text-sm text-muted-foreground mb-6">
            You can try to refresh the page or go back to the homepage.
            If the problem persists, please try again in a few moments.
          </p>
          {/* Conditionally render more detailed error info in development */}
          {process.env.NODE_ENV === 'development' && error?.message && (
            <div className="mt-4 p-3 bg-muted/30 border border-destructive/20 rounded-md text-left text-xs max-h-48 overflow-y-auto">
                <p className="font-semibold text-destructive mb-1">Error Details (Development Mode):</p>
                <pre className="whitespace-pre-wrap break-all">{error.message}</pre>
                {error.digest && <pre className="mt-1">Digest: {error.digest}</pre>}
                {error.stack && <pre className="mt-2 text-[0.7rem] text-muted-foreground/80">Stack: {error.stack}</pre>}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button onClick={() => reset()} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go to Homepage
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
