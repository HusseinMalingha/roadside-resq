
"use client";

import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, LogIn, Phone, KeyRound, AlertCircle } from 'lucide-react';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle as ShadcnAlertTitle } from "@/components/ui/alert";

const LoginClientPage: FC = () => {
  const { 
    signInWithGoogle, 
    signInWithPhoneNumberStep1, 
    signInWithPhoneNumberStep2, 
    loading: authLoading, 
    setupRecaptcha, 
    user,
    isFirebaseReady
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [appVerifier, setAppVerifier] = useState<RecaptchaVerifier | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (user && !authLoading) {
      router.push(redirectUrl);
    }
  }, [user, authLoading, router, redirectUrl]);

  useEffect(() => {
    if (isFirebaseReady && typeof window !== 'undefined' && !appVerifier) {
      const verifierInstance = setupRecaptcha('recaptcha-container-invisible');
      if (verifierInstance) {
        setAppVerifier(verifierInstance);
      } else {
        toast({
            title: "ReCAPTCHA Setup Issue",
            description: "Could not initialize reCAPTCHA for phone sign-in. Please refresh or try Google Sign-In.",
            variant: "destructive",
            duration: 7000,
        });
      }
    }
  }, [setupRecaptcha, appVerifier, isFirebaseReady, toast]);

  const handleGoogleSignIn = async () => {
    if (!isFirebaseReady) {
      toast({ title: "Service Unavailable", description: "Authentication services not ready.", variant: "destructive"});
      return;
    }
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      // Error handled by AuthContext
    } finally {
      setIsSubmitting(false); 
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseReady || !appVerifier || !phoneNumber.trim()) {
      toast({
        title: "Cannot Send OTP",
        description: !isFirebaseReady ? "Authentication service is not ready." : !appVerifier ? "ReCAPTCHA verifier is not ready. Please refresh." : "Phone number is required.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    const result = await signInWithPhoneNumberStep1(phoneNumber, appVerifier);
    if (result) {
      setConfirmationResult(result);
      setOtpSent(true);
    } else {
      appVerifier?.clear();
      setAppVerifier(null);
    }
    setIsSubmitting(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseReady) {
      toast({ title: "Service Unavailable", description: "Authentication services not ready.", variant: "destructive"});
      return;
    }
    if (!otp.trim() || !confirmationResult) {
      toast({
        title: "Cannot Verify OTP",
        description: !otp.trim() ? "OTP is required." : "Confirmation result is missing.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await signInWithPhoneNumberStep2(confirmationResult, otp);
    } catch (error) {
      // Error handled by AuthContext
    } finally {
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
  
  if (user && !authLoading) {
     return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4">Redirecting...</p>
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
            <Alert variant="destructive" className="mb-4 text-center">
                <AlertCircle className="h-4 w-4 inline-block mr-2" />
                <ShadcnAlertTitle className="inline font-semibold">Authentication Unavailable</ShadcnAlertTitle>
                <AlertDescription className="block text-xs">
                    Firebase services are currently offline. Please check configuration or try again later.
                </AlertDescription>
            </Alert>
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
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting || !appVerifier || !isFirebaseReady || !phoneNumber.trim()}
                  >
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
                  <Button type="submit" className="w-full" disabled={isSubmitting || !isFirebaseReady || !otp.trim()}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                    Verify OTP
                  </Button>
                  <Button variant="link" onClick={() => {setOtpSent(false); setOtp(''); setConfirmationResult(null);}} className="text-sm p-0 h-auto" disabled={isSubmitting}>Change Number</Button>
                </form>
              )}
            </TabsContent>
            <TabsContent value="google" className="space-y-4 pt-4">
              <Button 
                onClick={handleGoogleSignIn} 
                className="w-full" 
                disabled={isSubmitting || !isFirebaseReady}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                Sign In with Google
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <div id="recaptcha-container-invisible"></div>
    </div>
  );
};

export default LoginClientPage;
