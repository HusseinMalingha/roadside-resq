
"use client";

import type { ReactNode, FC } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, type User, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult, type Auth } from '@/lib/firebase';
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
  const [loading, setLoading] = useState(true); // For initial auth state check
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
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({ title: "Success", description: "Signed in with Google successfully." });
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      toast({ title: "Error", description: error.message || "Failed to sign in with Google.", variant: "destructive" });
      throw error; // Re-throw to allow calling component to handle UI state
    }
  };
  
  const setupRecaptcha = useCallback((elementId: string): RecaptchaVerifier | null => {
    if (typeof window !== 'undefined') {
      const recaptchaContainer = document.getElementById(elementId);
      if (recaptchaContainer) {
        try {
          const verifier = new RecaptchaVerifier(
            auth as Auth, 
            recaptchaContainer,
            {
              'size': 'invisible',
              'callback': (response: any) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
              },
              'expired-callback': () => {
                toast({ title: "ReCAPTCHA Expired", description: "Please try verifying again.", variant: "destructive" });
              }
            }
          );
          return verifier;
        } catch (e: any) {
          console.error("Error initializing RecaptchaVerifier:", e);
          toast({ title: "ReCAPTCHA Setup Failed", description: `Could not initialize reCAPTCHA: ${e.message || 'Unknown error'}. Try refreshing.`, variant: "destructive" });
          return null;
        }
      } else {
        console.warn(`Recaptcha container with id '${elementId}' not found in the DOM.`);
        return null;
      }
    }
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // auth is stable, toast from useToast should be stable

  const signInWithPhoneNumberStep1 = async (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult | null> => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      toast({ title: "OTP Sent", description: "An OTP has been sent to your phone number." });
      return confirmationResult;
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({ title: "Error Sending OTP", description: error.message || "Failed to send OTP. Check the phone number and try again.", variant: "destructive" });
      if (appVerifier && typeof (appVerifier as any).render === 'function' && (window as any).grecaptcha) {
        (appVerifier as any).render().then((widgetId: any) => {
             if (typeof window !== 'undefined' && (window as any).grecaptcha && widgetId !== undefined) {
                (window as any).grecaptcha.reset(widgetId);
             }
        }).catch((renderError: any) => console.error("Error rendering or resetting reCAPTCHA: ", renderError));
      }
      return null; // Keep returning null on error as per existing logic for this step
    }
  };

  const signInWithPhoneNumberStep2 = async (confirmationResult: ConfirmationResult, verificationCode: string) => {
    try {
      await confirmationResult.confirm(verificationCode);
      toast({ title: "Success", description: "Signed in with phone number successfully." });
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast({ title: "Error Verifying OTP", description: error.message || "Invalid OTP or an error occurred.", variant: "destructive" });
      throw error; // Re-throw to allow calling component to handle UI state
    }
  };

  const signOut = async () => {
    // No need for setLoading(true) here, as onAuthStateChanged will handle UI updates.
    try {
      await firebaseSignOut(auth);
      setUser(null); // Explicitly set user to null, though onAuthStateChanged will also fire
      toast({ title: "Signed Out", description: "You have been signed out." });
      router.push('/'); 
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({ title: "Error", description: error.message || "Failed to sign out.", variant: "destructive" });
    }
    // No finally setLoading(false) as the main loading is for initial auth check.
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
