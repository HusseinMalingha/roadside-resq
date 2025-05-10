
"use client";

import type { ReactNode, FC } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  auth as firebaseAuthInstance, // Renamed import
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  type User, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  type ConfirmationResult, 
  onAuthStateChanged,
  type FirebaseAuthType // Ensure this type is correctly imported or defined if not from 'firebase/auth'
} from '@/lib/firebase'; // Correct path to firebase.ts
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

// Define roles
export type UserRole = 'admin' | 'mechanic' | 'user' | null;

const ADMIN_EMAILS = ['admin@roadside.com', 'admin@example.com'];
const MECHANIC_EMAILS = ['mechanic@roadside.com', 'mechanic@example.com'];

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  isFirebaseReady: boolean; // New state to indicate if Firebase auth is usable
  signInWithGoogle: () => Promise<void>;
  signInWithPhoneNumberStep1: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult | null>;
  signInWithPhoneNumberStep2: (confirmationResult: ConfirmationResult, verificationCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  setupRecaptcha: (elementId: string) => RecaptchaVerifier | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (firebaseAuthInstance) {
      setIsFirebaseReady(true);
      const unsubscribe = onAuthStateChanged(firebaseAuthInstance, (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          let determinedRole: UserRole = 'user';
          if (currentUser.email && ADMIN_EMAILS.includes(currentUser.email)) {
            determinedRole = 'admin';
          } else if (currentUser.email && MECHANIC_EMAILS.includes(currentUser.email)) {
            determinedRole = 'mechanic';
          }
          setRole(determinedRole);
        } else {
          setRole(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsFirebaseReady(false);
      setLoading(false);
      if (typeof window !== 'undefined') { // Only show toast on client
        toast({
          title: "Firebase Not Configured",
          description: "Authentication services are unavailable. Please check the console for details and ensure Firebase is correctly set up with environment variables.",
          variant: "destructive",
          duration: 10000, // Keep it visible for a while
        });
      }
      console.warn("AuthContext: Firebase auth instance is not available. Auth features will be disabled.");
    }
  }, [toast]);

  const signInWithGoogle = async () => {
    if (!firebaseAuthInstance || !isFirebaseReady) {
      toast({ title: "Error", description: "Firebase not configured. Cannot sign in.", variant: "destructive" });
      console.error("signInWithGoogle: Firebase not ready.");
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(firebaseAuthInstance, provider);
      toast({ title: "Success", description: "Signed in with Google successfully." });
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      toast({ title: "Error", description: error.message || "Failed to sign in with Google.", variant: "destructive" });
      throw error;
    }
  };
  
  const setupRecaptcha = useCallback((elementId: string): RecaptchaVerifier | null => {
    if (!firebaseAuthInstance || !isFirebaseReady) {
      console.error("setupRecaptcha: Firebase not configured. Cannot setup reCAPTCHA.");
      toast({ title: "Setup Error", description: "Firebase not ready for reCAPTCHA.", variant: "destructive" });
      return null;
    }
    if (typeof window !== 'undefined') {
      const recaptchaContainer = document.getElementById(elementId);
      if (recaptchaContainer) {
        while (recaptchaContainer.firstChild) {
            recaptchaContainer.removeChild(recaptchaContainer.firstChild);
        }
        try {
          // Ensure firebaseAuthInstance is of type Auth (FirebaseAuthType)
          const verifier = new RecaptchaVerifier(
            firebaseAuthInstance as FirebaseAuthType, 
            recaptchaContainer,
            {
              'size': 'invisible',
              'callback': () => { /* reCAPTCHA solved */ },
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
  }, [toast, isFirebaseReady]);

  const signInWithPhoneNumberStep1 = async (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult | null> => {
    if (!firebaseAuthInstance || !isFirebaseReady) {
      toast({ title: "Error", description: "Firebase not configured. Cannot send OTP.", variant: "destructive" });
      console.error("signInWithPhoneNumberStep1: Firebase not ready.");
      return null;
    }
    try {
      const confirmationResult = await signInWithPhoneNumber(firebaseAuthInstance, phoneNumber, appVerifier);
      toast({ title: "OTP Sent", description: "An OTP has been sent to your phone number." });
      return confirmationResult;
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({ title: "Error Sending OTP", description: error.message || "Failed to send OTP. Check the phone number and try again.", variant: "destructive" });
      // Reset reCAPTCHA
      if (appVerifier && typeof window !== 'undefined' && (window as any).grecaptcha) {
        try {
            const widgetId = (appVerifier as any).widgetId; 
            if (widgetId !== undefined && (window as any).grecaptcha.reset) {
                 (window as any).grecaptcha.reset(widgetId);
            } else {
                 appVerifier.clear();
            }
        } catch (resetError) {
            console.error("Error resetting reCAPTCHA: ", resetError);
        }
      }
      return null; 
    }
  };

  const signInWithPhoneNumberStep2 = async (confirmationResult: ConfirmationResult, verificationCode: string) => {
    if (!firebaseAuthInstance || !isFirebaseReady) {
      toast({ title: "Error", description: "Firebase not configured. Cannot verify OTP.", variant: "destructive" });
      console.error("signInWithPhoneNumberStep2: Firebase not ready.");
      throw new Error("Firebase not configured.");
    }
    try {
      await confirmationResult.confirm(verificationCode);
      toast({ title: "Success", description: "Signed in with phone number successfully." });
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast({ title: "Error Verifying OTP", description: error.message || "Invalid OTP or an error occurred.", variant: "destructive" });
      throw error; 
    }
  };

  const signOut = async () => {
    if (!firebaseAuthInstance || !isFirebaseReady) {
      toast({ title: "Error", description: "Firebase not configured. Cannot sign out.", variant: "destructive" });
      console.error("signOut: Firebase not ready.");
      return;
    }
    try {
      await firebaseSignOut(firebaseAuthInstance);
      toast({ title: "Signed Out", description: "You have been signed out." });
      router.push('/'); 
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({ title: "Error", description: error.message || "Failed to sign out.", variant: "destructive" });
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, isFirebaseReady, signInWithGoogle, signInWithPhoneNumberStep1, signInWithPhoneNumberStep2, signOut, setupRecaptcha }}>
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
