"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserCircle, AlertCircle, Home, Navigation, Info } from 'lucide-react';
import Link from 'next/link';
import EditProfileForm from '@/components/profile/EditProfileForm';
import EditVehicleInfoForm from '@/components/profile/EditVehicleInfoForm';
import { Separator } from '@/components/ui/separator';
import RequestHistoryItem from '@/components/request-history/RequestHistoryItem';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function ProfileClientPage() {
  const { user, userProfile, loading: authLoading, isFirebaseReady, role, refreshUserProfile, activeRequest, isLoadingActiveRequest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user && isFirebaseReady) {
      router.push('/login?redirect=/profile');
    }
    // Allow admin to view their own simple profile if they somehow land here, but primary nav should guide them to garage-admin.
    // Mechanic and CR roles should definitely be redirected.
    if (!authLoading && user && (role === 'mechanic' || role === 'customer_relations')) {
      router.push('/garage-admin'); 
    }
  }, [user, authLoading, router, isFirebaseReady, role]);

  if (authLoading || (!userProfile && user && isFirebaseReady && !isLoadingActiveRequest) || (user && isLoadingActiveRequest && !userProfile)) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  if (!isFirebaseReady && !authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardHeader>
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle>Service Unavailable</CardTitle>
            <CardDescription>Cannot connect to profile services. Please try again later.</CardDescription>
          </CardHeader>
          <CardFooter>
             <Button asChild className="w-full">
                <Link href="/">
                    <Home className="mr-2 h-4 w-4" /> Go to Homepage
                </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!user && !authLoading && isFirebaseReady) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3">Redirecting to login...</p>
      </div>
    );
  }
  
  // Redirect staff (non-admin) away from user profile page if they are not 'user' or 'admin'
  // Admins might view a simplified version or be primarily directed to /garage-admin
  if (role && !['user', 'admin'].includes(role)) {
    return (
         <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader>
                    <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <CardTitle className="text-2xl">Access Denied</CardTitle>
                    <CardDescription>This profile page is for drivers. Staff should use the Garage Admin portal.</CardDescription>
                </CardHeader>
                 <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/garage-admin">
                             Go to Garage Admin
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  if (!userProfile && !authLoading) { // Check authLoading to ensure profile fetch had a chance
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Profile Not Found</CardTitle>
            <CardDescription>We couldn't load your profile information. This could be a new account.</CardDescription>
          </CardHeader>
          <CardFooter className="flex-col space-y-2">
            <Button onClick={() => refreshUserProfile()} className="w-full">Try Reloading Profile</Button>
            <Button asChild className="w-full" variant="outline">
                <Link href="/">
                    <Home className="mr-2 h-4 w-4" /> Go to Homepage
                </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }


  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4 md:px-0 space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-2xl md:text-3xl flex items-center">
                <UserCircle className="mr-3 h-8 w-8 text-primary" />
                My Profile {role === 'admin' ? '(Admin View)' : ''}
              </CardTitle>
              <CardDescription>View and manage your personal and vehicle information.</CardDescription>
            </div>
             <Button asChild variant="outline">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" /> Back to Home
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>
      
      {/* Active Request Section - only for 'user' role */}
      {role === 'user' && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Navigation className="mr-2 h-6 w-6 text-primary" />
              Active Service Request
            </CardTitle>
            <CardDescription>Your current ongoing service request details.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingActiveRequest ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Checking for active requests...</p>
              </div>
            ) : activeRequest ? (
              <>
                <RequestHistoryItem request={activeRequest} />
                <Button asChild className="mt-4 w-full sm:w-auto">
                  <Link href="/">
                    <Navigation className="mr-2 h-4 w-4" /> Track Your Request
                  </Link>
                </Button>
              </>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Active Requests</AlertTitle>
                <AlertDescription>
                  You do not have any ongoing service requests.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {userProfile && (
        <>
          <EditProfileForm userProfile={userProfile} onProfileUpdate={refreshUserProfile} />
          {role === 'user' && ( // Only show vehicle info form for 'user' role
            <>
              <Separator />
              <EditVehicleInfoForm userProfile={userProfile} onVehicleInfoUpdate={refreshUserProfile} />
            </>
          )}
        </>
      )}

    </div>
  );
}