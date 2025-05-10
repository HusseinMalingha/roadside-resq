
"use client";

import type { ReactNode, FC } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, type User, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult, type Auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";

// Define roles
export type UserRole = 'admin' | 'mechanic' | 'user' | null;

// Hardcoded emails for admin and mechanic roles (for demonstration)
// In a real app, these should come from a secure backend or environment variables and ideally use UIDs.
const ADMIN_EMAILS = ['admin@roadside.com', 'admin@example.com'];
const MECHANIC_EMAILS = ['mechanic@roadside.com', 'mechanic@example.com'];


interface AuthContextType {
  user: User | null;
  role: UserRole;
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
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true); // For initial auth state check
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Determine role
        let determinedRole: UserRole = 'user';
        if (currentUser.email && ADMIN_EMAILS.includes(currentUser.email)) {
          determinedRole = 'admin';
        } else if (currentUser.email && MECHANIC_EMAILS.includes(currentUser.email)) {
          determinedRole = 'mechanic';
        }
        // Add more complex role logic here if needed (e.g., based on UID or custom claims if using backend)
        setRole(determinedRole);
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Role will be set by onAuthStateChanged
      toast({ title: "Success", description: "Signed in with Google successfully." });
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      toast({ title: "Error", description: error.message || "Failed to sign in with Google.", variant: "destructive" });
      throw error; 
    }
  };
  
  const setupRecaptcha = useCallback((elementId: string): RecaptchaVerifier | null => {
    if (typeof window !== 'undefined') {
      const recaptchaContainer = document.getElementById(elementId);
      if (recaptchaContainer) {
        // Ensure the container is empty before initializing a new verifier
        while (recaptchaContainer.firstChild) {
            recaptchaContainer.removeChild(recaptchaContainer.firstChild);
        }
        try {
          const verifier = new RecaptchaVerifier(
            auth as Auth, 
            recaptchaContainer,
            {
              'size': 'invisible',
              'callback': (response: any) => {
                // reCAPTCHA solved
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
  }, [toast]);

  const signInWithPhoneNumberStep1 = async (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult | null> => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      // Role will be set by onAuthStateChanged after successful OTP verification
      toast({ title: "OTP Sent", description: "An OTP has been sent to your phone number." });
      return confirmationResult;
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({ title: "Error Sending OTP", description: error.message || "Failed to send OTP. Check the phone number and try again.", variant: "destructive" });
      if (appVerifier && typeof (appVerifier as any).render === 'function' && typeof window !== 'undefined' && (window as any).grecaptcha) {
        try {
            // Attempt to find the widgetId if not readily available. This is a common pattern.
            const widgetId = (appVerifier as any).widgetId; 
            if (widgetId !== undefined && (window as any).grecaptcha && typeof (window as any).grecaptcha.reset === 'function') {
                 (window as any).grecaptcha.reset(widgetId);
            } else {
                // Fallback if specific widgetId reset fails, try to re-render the verifier.
                // This might be needed if the verifier instance got into a bad state.
                // Note: This could cause issues if not handled carefully.
                // Often, creating a new verifier instance is safer after certain errors.
                 appVerifier.clear(); // Clear the existing verifier to avoid conflicts
            }
        } catch (resetError) {
            console.error("Error resetting or clearing reCAPTCHA: ", resetError);
        }
      }
      return null; 
    }
  };

  const signInWithPhoneNumberStep2 = async (confirmationResult: ConfirmationResult, verificationCode: string) => {
    try {
      await confirmationResult.confirm(verificationCode);
      // Role will be set by onAuthStateChanged
      toast({ title: "Success", description: "Signed in with phone number successfully." });
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast({ title: "Error Verifying OTP", description: error.message || "Invalid OTP or an error occurred.", variant: "destructive" });
      throw error; 
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // User and role will be set to null by onAuthStateChanged
      toast({ title: "Signed Out", description: "You have been signed out." });
      router.push('/'); 
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({ title: "Error", description: error.message || "Failed to sign out.", variant: "destructive" });
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signInWithGoogle, signInWithPhoneNumberStep1, signInWithPhoneNumberStep2, signOut, setupRecaptcha }}>
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
