
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

const GoogleLogo = () => (
  <svg
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    className="mr-2 h-5 w-5"
  >
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    ></path>
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    ></path>
    <path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    ></path>
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    ></path>
    <path fill="none" d="M0 0h48v48H0z"></path>
  </svg>
);


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
      // Reset appVerifier if OTP sending failed to allow re-initialization
      if(appVerifier) {
          appVerifier.render().then((widgetId: any) => {
            // @ts-ignore
            if (typeof grecaptcha !== 'undefined' && grecaptcha.reset) {
                 // @ts-ignore
                grecaptcha.reset(widgetId);
            }
          }).catch((e: any) => console.warn("Error resetting reCAPTCHA widget", e));
      }
      setAppVerifier(null); // Force re-setup on next attempt if it failed
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
          <LogIn className="mx-auto h-10 w-10 md:h-12 md:w-12 text-primary mb-2 md:mb-3" />
          <CardTitle className="text-xl md:text-3xl">Login to ResQ</CardTitle>
          <CardDescription className="text-sm md:text-base">Sign in to access services and manage your requests.</CardDescription>
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
            <TabsContent value="phone" className="space-y-3 md:space-y-4 pt-3 md:pt-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3 md:space-y-4">
                  <div>
                    <Label htmlFor="phone" className="text-xs md:text-sm">Phone Number (e.g., +16505551234)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter your phone number"
                      required
                      disabled={isSubmitting || !isFirebaseReady}
                      className="text-sm md:text-base"
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
                <form onSubmit={handleVerifyOtp} className="space-y-3 md:space-y-4">
                  <div>
                    <Label htmlFor="otp" className="text-xs md:text-sm">Verification Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      required
                      disabled={isSubmitting || !isFirebaseReady}
                      className="text-sm md:text-base"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting || !isFirebaseReady || !otp.trim()}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                    Verify OTP
                  </Button>
                  <Button variant="link" onClick={() => {setOtpSent(false); setOtp(''); setConfirmationResult(null);}} className="text-xs md:text-sm p-0 h-auto" disabled={isSubmitting}>Change Number</Button>
                </form>
              )}
            </TabsContent>
            <TabsContent value="google" className="space-y-3 md:space-y-4 pt-3 md:pt-4">
              <Button 
                onClick={handleGoogleSignIn} 
                className="w-full" 
                variant="outline"
                disabled={isSubmitting || !isFirebaseReady}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleLogo />}
                Sign In with Google
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {/* This div MUST be present for invisible reCAPTCHA to work */}
      <div id="recaptcha-container-invisible"></div>
    </div>
  );
};

export default LoginClientPage;
