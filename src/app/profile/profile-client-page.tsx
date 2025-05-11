
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserCircle, AlertCircle, Home } from 'lucide-react';
import Link from 'next/link';
import EditProfileForm from '@/components/profile/EditProfileForm';
import EditVehicleInfoForm from '@/components/profile/EditVehicleInfoForm';
import { Separator } from '@/components/ui/separator';

export default function ProfileClientPage() {
  const { user, userProfile, loading: authLoading, isFirebaseReady, role, refreshUserProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user && isFirebaseReady) {
      router.push('/login?redirect=/profile');
    }
    if (!authLoading && user && role !== 'user') {
      // Redirect staff/admin away from user profile page
      router.push('/garage-admin'); 
    }
  }, [user, authLoading, router, isFirebaseReady, role]);

  if (authLoading || (!userProfile && user && isFirebaseReady)) {
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
    // Should be redirected by useEffect, but as a fallback:
    return (
      <div className="flex-grow flex items-center justify-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Profile Not Found</CardTitle>
            <CardDescription>We couldn't load your profile information. Please try again or contact support.</CardDescription>
          </CardHeader>
          <CardFooter className="flex-col space-y-2">
            <Button onClick={() => refreshUserProfile()} className="w-full">Retry</Button>
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
  
  // If user role is not 'user', redirect them
  if (role && role !== 'user') {
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


  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4 md:px-0 space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-2xl md:text-3xl flex items-center">
                <UserCircle className="mr-3 h-8 w-8 text-primary" />
                My Profile
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

      <EditProfileForm userProfile={userProfile} onProfileUpdate={refreshUserProfile} />
      <Separator />
      <EditVehicleInfoForm userProfile={userProfile} onVehicleInfoUpdate={refreshUserProfile} />

    </div>
  );
}

