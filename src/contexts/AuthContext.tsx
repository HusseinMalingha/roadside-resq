
"use client";

import type { ReactNode, FC } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, type User, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";


interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPhoneNumberStep1: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult | null>;
  signInWithPhoneNumberStep2: (confirmationResult: ConfirmationResult, verificationCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  setupRecaptcha: (elementId: string) => RecaptchaVerifier | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({ title: "Success", description: "Signed in with Google successfully." });
      router.push('/'); 
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      toast({ title: "Error", description: error.message || "Failed to sign in with Google.", variant: "destructive" });
      setLoading(false);
    }
  };
  
  const setupRecaptcha = (elementId: string): RecaptchaVerifier | null => {
    if (typeof window !== 'undefined') {
      const recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
        'size': 'invisible', // Can be 'normal' or 'compact' or 'invisible'
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
           toast({ title: "ReCAPTCHA Expired", description: "Please try verifying again.", variant: "destructive" });
        }
      });
      return recaptchaVerifier;
    }
    return null;
  };

  const signInWithPhoneNumberStep1 = async (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult | null> => {
    setLoading(true);
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      toast({ title: "OTP Sent", description: "An OTP has been sent to your phone number." });
      setLoading(false);
      return confirmationResult;
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({ title: "Error Sending OTP", description: error.message || "Failed to send OTP. Check the phone number and try again.", variant: "destructive" });
      setLoading(false);
      // Reset reCAPTCHA if it exists and is of type RecaptchaVerifier
      if (appVerifier && typeof (appVerifier as any).render === 'function') {
        (appVerifier as any).render().then((widgetId: any) => {
             if (typeof window !== 'undefined' && (window as any).grecaptcha) {
                (window as any).grecaptcha.reset(widgetId);
             }
        });
      }
      return null;
    }
  };

  const signInWithPhoneNumberStep2 = async (confirmationResult: ConfirmationResult, verificationCode: string) => {
    setLoading(true);
    try {
      await confirmationResult.confirm(verificationCode);
      toast({ title: "Success", description: "Signed in with phone number successfully." });
      router.push('/');
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast({ title: "Error Verifying OTP", description: error.message || "Invalid OTP or an error occurred.", variant: "destructive" });
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
      toast({ title: "Signed Out", description: "You have been signed out." });
      router.push('/'); 
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({ title: "Error", description: error.message || "Failed to sign out.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithPhoneNumberStep1, signInWithPhoneNumberStep2, signOut, setupRecaptcha }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
