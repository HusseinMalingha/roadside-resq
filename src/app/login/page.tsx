
"use client";

import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn, Phone, KeyRound } from 'lucide-react';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from 'next/navigation';

const LoginPage: FC = () => {
  const { 
    signInWithGoogle, 
    signInWithPhoneNumberStep1, 
    signInWithPhoneNumberStep2, 
    loading: authLoading, 
    setupRecaptcha, 
    user,
    isFirebaseReady // Added from AuthContext
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [appVerifier, setAppVerifier] = useState<RecaptchaVerifier | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (isFirebaseReady && typeof window !== 'undefined' && !appVerifier) {
      const verifier = setupRecaptcha('recaptcha-container-invisible');
      if (verifier) {
        setAppVerifier(verifier);
      }
    }
  }, [setupRecaptcha, appVerifier, isFirebaseReady]);


  const handleGoogleSignIn = async () => {
    if (!isFirebaseReady) return;
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      router.push(redirectUrl);
    } catch (error) {
      setIsSubmitting(false); 
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseReady) return;
    if (!phoneNumber || !appVerifier) {
      if(!appVerifier && isFirebaseReady) { // Attempt to re-setup verifier if not present and Firebase is ready
         const verifier = setupRecaptcha('recaptcha-container-invisible');
         if (verifier) {
           setAppVerifier(verifier);
         } else {
            // Failed to setup verifier, cannot proceed
            return;
         }
      } else if (!appVerifier && !isFirebaseReady) {
        // Firebase not ready, cannot proceed
        return;
      } else if (!phoneNumber) {
        // Phone number missing
        return;
      }
    }
    setIsSubmitting(true);
    const result = await signInWithPhoneNumberStep1(phoneNumber, appVerifier);
    if (result) {
      setConfirmationResult(result);
      setOtpSent(true);
    }
    setIsSubmitting(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseReady) return;
    if (!otp || !confirmationResult) return;
    setIsSubmitting(true);
    try {
      await signInWithPhoneNumberStep2(confirmationResult, otp);
      router.push(redirectUrl);
    } catch (error) {
      setIsSubmitting(false); 
    }
  };

  if (authLoading && !user) { 
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-grow flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-2xl md:text-3xl">Login to Roadside Rescue</CardTitle>
          <CardDescription>Sign in to access services and manage your requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isFirebaseReady && (
            <div className="text-center text-destructive mb-4">
              Authentication services are currently unavailable. Please try again later.
            </div>
          )}
          <Tabs defaultValue="phone" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="phone" disabled={!isFirebaseReady}>Phone Sign-In</TabsTrigger>
              <TabsTrigger value="google" disabled={!isFirebaseReady}>Google Sign-In</TabsTrigger>
            </TabsList>
            <TabsContent value="phone" className="space-y-4 pt-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone Number (e.g., +16505551234)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter your phone number"
                      required
                      disabled={isSubmitting || !isFirebaseReady}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting || !appVerifier || !isFirebaseReady}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                    Send OTP
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <Label htmlFor="otp">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      required
                      disabled={isSubmitting || !isFirebaseReady}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting || !isFirebaseReady}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                    Verify OTP
                  </Button>
                  <Button variant="link" onClick={() => {setOtpSent(false); setOtp(''); setConfirmationResult(null);}} className="text-sm p-0 h-auto" disabled={isSubmitting || !isFirebaseReady}>
                    Change phone number?
                  </Button>
                </form>
              )}
               <div id="recaptcha-container-invisible"></div>
            </TabsContent>
            <TabsContent value="google" className="pt-4">
               <Button onClick={handleGoogleSignIn} variant="outline" className="w-full text-base py-6" disabled={isSubmitting || !isFirebaseReady}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                  </svg>
                )}
                Sign in with Google
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
         <CardFooter>
           <p className="text-xs text-muted-foreground text-center w-full">
             By signing in, you agree to our Terms of Service and Privacy Policy.
           </p>
         </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
