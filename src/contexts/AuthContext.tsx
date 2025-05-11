
"use client";

import type { ReactNode, FC } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  auth as firebaseAuthInstance, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  type User, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  type ConfirmationResult, 
  onAuthStateChanged,
  type FirebaseAuthType,
} from '@/lib/firebase'; 
import { getStaffMemberByEmail } from '@/services/staffService';
import { getUserProfile, updateUserProfile } from '@/services/userService'; // Import userService functions
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import type { UserRole, UserProfile } from '@/types'; 

const ADMIN_EMAIL = 'husseinmalingha@gmail.com';
const ADMIN_PHONE_NUMBER = '+256759794023';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null; // Store full user profile
  role: UserRole | null; 
  loading: boolean;
  isFirebaseReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPhoneNumberStep1: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult | null>;
  signInWithPhoneNumberStep2: (confirmationResult: ConfirmationResult, verificationCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  setupRecaptcha: (elementId: string) => RecaptchaVerifier | null;
  refreshUserProfile: () => Promise<void>; // Function to manually refresh profile
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchAndSetUserProfile = useCallback(async (currentUser: User) => {
    let fetchedProfile = await getUserProfile(currentUser.uid);
    let determinedRole: UserRole = fetchedProfile?.role || 'user';
    const userEmailLower = currentUser.email?.toLowerCase();

    if (
      (userEmailLower && userEmailLower === ADMIN_EMAIL.toLowerCase()) ||
      (currentUser.phoneNumber && currentUser.phoneNumber === ADMIN_PHONE_NUMBER)
    ) {
      determinedRole = 'admin';
    } else if (userEmailLower && determinedRole === 'user') { // Only check staff if not already admin
      try {
        const staffProfile = await getStaffMemberByEmail(userEmailLower);
        if (staffProfile && (staffProfile.role === 'mechanic' || staffProfile.role === 'customer_relations')) {
          determinedRole = staffProfile.role;
        }
      } catch (error) {
        console.error("Error fetching staff role from Firestore:", error);
      }
    }
    
    // Prepare profile data, ensuring new fields are included
    const profileDataToUpdate: Partial<UserProfile> = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL,
        phoneNumber: currentUser.phoneNumber, // This is from Firebase Auth
        role: determinedRole,
        // Ensure vehicleInfo and contactPhoneNumber are preserved if they exist, or initialized
        vehicleInfo: fetchedProfile?.vehicleInfo || null,
        contactPhoneNumber: fetchedProfile?.contactPhoneNumber || currentUser.phoneNumber || null,
    };

    await updateUserProfile(currentUser.uid, profileDataToUpdate);
    const updatedProfile = await getUserProfile(currentUser.uid); // Re-fetch to get merged data
    setUserProfile(updatedProfile);
    setRole(determinedRole);

  }, []);


  useEffect(() => {
    if (firebaseAuthInstance) { 
      setIsFirebaseReady(true);
      const unsubscribe = onAuthStateChanged(firebaseAuthInstance, async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          await fetchAndSetUserProfile(currentUser);
        } else {
          setUserProfile(null);
          setRole(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsFirebaseReady(false);
      setLoading(false); 
      if (typeof window !== 'undefined') {
        toast({
          title: "Firebase Services Not Configured",
          description: "Auth or Firestore services are unavailable. Please check environment variables.",
          variant: "destructive",
          duration: 10000,
        });
      }
      console.warn("AuthContext: Firebase auth or firestore instance is not available. Features may be disabled.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAndSetUserProfile]); 

  const refreshUserProfile = useCallback(async () => {
    if (user) {
        setLoading(true);
        await fetchAndSetUserProfile(user);
        setLoading(false);
    }
  }, [user, fetchAndSetUserProfile]);


  const signInWithGoogle = async () => {
    if (!firebaseAuthInstance || !isFirebaseReady) {
      toast({ title: "Authentication Error", description: "Firebase not configured. Cannot sign in with Google.", variant: "destructive" });
      console.error("signInWithGoogle: Firebase not ready.");
      return;
    }
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(firebaseAuthInstance, provider);
      // Profile update handled by onAuthStateChanged
      toast({ title: "Sign-In Successful", description: "Signed in with Google." });
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      toast({ title: "Google Sign-In Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
      throw error;
    } finally {
      // setLoading(false); // onAuthStateChanged will set loading
    }
  };
  
  const setupRecaptcha = useCallback((elementId: string): RecaptchaVerifier | null => {
    if (!firebaseAuthInstance || !isFirebaseReady) {
      console.error("setupRecaptcha: Firebase not configured or not ready. Cannot setup reCAPTCHA.");
      return null;
    }
    if (typeof window !== 'undefined') {
      const recaptchaContainer = document.getElementById(elementId);
      if (recaptchaContainer) {
        
        while (recaptchaContainer.firstChild) {
            recaptchaContainer.removeChild(recaptchaContainer.firstChild);
        }
        try {
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
          toast({ title: "ReCAPTCHA Setup Failed", description: `Could not initialize reCAPTCHA: ${e.message || 'Unknown error'}. Please refresh the page.`, variant: "destructive" });
          return null;
        }
      } else {
        console.warn(`Recaptcha container with id '${elementId}' not found. ReCAPTCHA setup will fail.`);
        return null;
      }
    }
    return null;
  }, [isFirebaseReady, toast]);


  const signInWithPhoneNumberStep1 = async (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult | null> => {
    if (!firebaseAuthInstance || !isFirebaseReady) {
      toast({ title: "Authentication Error", description: "Firebase not configured. Cannot send OTP.", variant: "destructive" });
      console.error("signInWithPhoneNumberStep1: Firebase not ready.");
      return null;
    }
    setLoading(true);
    try {
      const confirmationResult = await signInWithPhoneNumber(firebaseAuthInstance, phoneNumber, appVerifier);
      toast({ title: "OTP Sent", description: "An OTP has been sent to your phone number." });
      return confirmationResult;
    } catch (error: any) { 
      console.error("Error sending OTP:", error);
      let errorMessage = "Failed to send OTP. Please check the phone number and try again.";
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = "Invalid phone number format. Please use E.164 format (e.g., +16505551234).";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many requests. Please try again later.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message?.includes("reCAPTCHA")) {
        errorMessage = "ReCAPTCHA verification failed. Please try again.";
      }
      
      toast({ title: "Error Sending OTP", description: errorMessage, variant: "destructive" });
      
      try {
        // @ts-ignore 
        if (appVerifier && typeof appVerifier.clear === 'function') appVerifier.clear(); 
      } catch(e) {
        console.warn("Could not clear appVerifier during OTP send error:", e);
      }
      return null; 
    } finally {
      // setLoading(false); // onAuthStateChanged will set loading
    }
  };

  const signInWithPhoneNumberStep2 = async (confirmationResult: ConfirmationResult, verificationCode: string) => {
    if (!firebaseAuthInstance || !isFirebaseReady) {
      toast({ title: "Authentication Error", description: "Firebase not configured. Cannot verify OTP.", variant: "destructive" });
      console.error("signInWithPhoneNumberStep2: Firebase not ready.");
      throw new Error("Firebase not configured.");
    }
    setLoading(true);
    try {
      await confirmationResult.confirm(verificationCode);
      // Profile update handled by onAuthStateChanged
      toast({ title: "Sign-In Successful", description: "Signed in with phone number." });
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      let errorMessage = "Invalid OTP or an error occurred.";
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = "Invalid verification code. Please try again.";
      } else if (error.code === 'auth/code-expired') {
        errorMessage = "The verification code has expired. Please request a new one.";
      }
      toast({ title: "Error Verifying OTP", description: errorMessage, variant: "destructive" });
      throw error; 
    } finally {
      // setLoading(false); // onAuthStateChanged will set loading
    }
  };

  const signOutUser = async () => { 
    if (!firebaseAuthInstance || !isFirebaseReady) {
      toast({ title: "Authentication Error", description: "Firebase not configured. Cannot sign out.", variant: "destructive" });
      console.error("signOut: Firebase not ready.");
      return;
    }
    setLoading(true);
    try {
      await firebaseSignOut(firebaseAuthInstance);
      toast({ title: "Signed Out", description: "You have been signed out successfully." });
      setUser(null); 
      setUserProfile(null);
      setRole(null);   
      router.push('/login'); 
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({ title: "Sign-Out Failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, role, loading, isFirebaseReady, signInWithGoogle, signInWithPhoneNumberStep1, signInWithPhoneNumberStep2, signOut: signOutUser, setupRecaptcha, refreshUserProfile }}>
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

