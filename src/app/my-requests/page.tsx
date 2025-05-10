
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getRequestsFromStorage } from '@/lib/localStorageUtils';
import type { ServiceRequest } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ListChecks, Home, AlertCircle, CalendarDays, Car, Users, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import RequestHistoryItem from '@/components/request-history/RequestHistoryItem'; // Will create this component

export default function MyRequestsPage() {
  const { user, loading: authLoading, isFirebaseReady } = useAuth();
  const router = useRouter();
  const [userRequests, setUserRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login?redirect=/my-requests');
      } else {
        const allRequests = getRequestsFromStorage();
        // Filter requests by userId. For older requests without userId, this might not work.
        // Consider adding a fallback or note if handling very old data.
        const filteredRequests = allRequests
          .filter(req => req.userId === user.uid)
          .sort((a, b) => new Date(b.requestTime).getTime() - new Date(a.requestTime).getTime()); // Sort by most recent
        setUserRequests(filteredRequests);
        setIsLoading(false);
      }
    }
  }, [user, authLoading, router]);

  if (isLoading || authLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your requests...</p>
      </div>
    );
  }

  if (!user && !authLoading && isFirebaseReady) {
     // Should have been redirected, but as a fallback:
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
          {userRequests.length === 0 ? (
            <div className="text-center py-10">
              <Info className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold text-muted-foreground">No Past Requests Found</p>
              <p className="text-sm text-muted-foreground mt-1">You haven't made any service requests yet.</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-250px)] md:h-[calc(100vh-300px)]"> {/* Adjust height as needed */}
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
