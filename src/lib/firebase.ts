
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  PhoneAuthProvider, 
  RecaptchaVerifier, 
  signInWithPopup, 
  signInWithPhoneNumber, 
  onAuthStateChanged, 
  signOut, 
  type NextOrObserver, 
  type User, 
  type Auth, 
  type ConfirmationResult 
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  // Check if all required config values are present
  if (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  ) {
    app = initializeApp(firebaseConfig);
  } else {
    console.error(
      'Firebase configuration is incomplete. Please check your .env file and ensure all NEXT_PUBLIC_FIREBASE_* variables are set.'
    );
    // Fallback or throw an error, depending on how you want to handle missing config
    // For now, we'll let it proceed, but auth might fail.
    // A more robust solution might involve not initializing if config is missing.
    app = initializeApp({}); // This will likely cause issues but prevents immediate crash if some keys are missing
  }
} else {
  app = getApp();
}

const auth = getAuth(app);

export {
  app as firebaseApp, // Exporting the app instance can be useful for other Firebase services
  auth,
  GoogleAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut,
  type NextOrObserver,
  type User,
  type Auth,
  type ConfirmationResult
};
