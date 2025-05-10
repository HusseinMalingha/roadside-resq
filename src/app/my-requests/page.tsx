"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRequests } from '@/services/requestService'; // Import Firestore service
import type { ServiceRequest } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ListChecks, Home, AlertCircle, Users, Info, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import RequestHistoryItem from '@/components/request-history/RequestHistoryItem';

export default function MyRequestsPage() {
  const { user, loading: authLoading, isFirebaseReady } = useAuth();
  const router = useRouter();
  const [userRequests, setUserRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true); // For data fetching, distinct from authLoading

  useEffect(() => {
    if (!authLoading) { // Auth state has resolved
      if (!user && isFirebaseReady) { // Firebase ready, but no user
        router.push('/login?redirect=/my-requests');
      } else if (user && isFirebaseReady) { // Firebase ready and user exists
        setIsLoading(true); // Start data fetching loader
        getUserRequests(user.uid)
          .then((requests) => {
            setUserRequests(requests);
          })
          .catch(error => {
            console.error("Failed to fetch user requests:", error);
            // Optionally, show a toast message for the error using useToast()
          })
          .finally(() => {
            setIsLoading(false); // Stop data fetching loader
          });
      } else if (!isFirebaseReady) {
        // Firebase itself is not ready, stop loading, AuthContext will show a global toast.
        setIsLoading(false);
      }
    }
  }, [user, authLoading, router, isFirebaseReady]);

  if (authLoading || (isLoading && isFirebaseReady)) { // Show loader if auth is loading OR data is loading (and Firebase is ready)
    return (
      <div className="flex-grow flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your requests...</p>
      </div>
    );
  }

  if (!isFirebaseReady && !authLoading) { // Firebase not ready, auth resolved
     return (
        <div className="flex-grow flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center shadow-xl">
                <CardHeader>
                    <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <CardTitle>Service Unavailable</CardTitle>
                    <CardDescription>Cannot connect to services. Please try again later.</CardDescription>
                </CardHeader>
                 <CardFooter>
                    <Button onClick={() => window.location.reload()} className="w-full">
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh Page
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  if (!user && !authLoading && isFirebaseReady) { // Redirecting state or post-redirect pre-login page display
    return (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader>
                    <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <CardTitle className="text-2xl">Access Denied</CardTitle>
                    <CardDescription>You need to be logged in to view your requests.</CardDescription>
                </CardHeader>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/login?redirect=/my-requests">
                            <Users className="mr-2 h-4 w-4" /> Login
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }


  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 md:px-0">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-2xl md:text-3xl flex items-center">
                <ListChecks className="mr-3 h-7 w-7 text-primary" />
                My Service Requests
              </CardTitle>
              <CardDescription>A history of your past assistance requests with ResQ.</CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" /> Back to Home
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {userRequests.length === 0 && !isLoading ? ( // Also check isLoading to avoid "No requests" flash
            <div className="text-center py-10">
              <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No Past Requests Found</p>
              <p className="text-sm text-muted-foreground mt-1">You haven't made any service requests yet.</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-250px)] md:h-[calc(100vh-300px)]">
              <div className="space-y-4 p-1">
                {userRequests.map((request) => (
                  <RequestHistoryItem key={request.id} request={request} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

