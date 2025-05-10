
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
  type Auth as FirebaseAuthType, // Renamed to avoid conflict
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

let app: FirebaseApp | null = null;
let authInstance: FirebaseAuthType | null = null;

const allConfigValuesPresent =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId;
  // measurementId is often optional for basic auth, so not checked here for critical initialization

if (typeof window !== 'undefined') { // Ensure Firebase is initialized only on the client-side
  if (!getApps().length) {
    if (allConfigValuesPresent) {
      try {
        app = initializeApp(firebaseConfig);
        authInstance = getAuth(app);
        console.log("Firebase initialized successfully.");
      } catch (e) {
        console.error("Error initializing Firebase app:", e);
        // app and authInstance will remain null
      }
    } else {
      console.error(
        'Firebase configuration is incomplete. Please check your .env file and ensure all NEXT_PUBLIC_FIREBASE_* variables are set. Firebase features will be disabled.'
      );
      // app and authInstance will remain null
    }
  } else {
    app = getApp(); // If already initialized, get the app
    if (app) { // Ensure app is not null before calling getAuth
        authInstance = getAuth(app); // Get auth from the existing app
    } else {
        console.error("Firebase app was expected to be initialized but is null.");
    }
  }
}


export const firebaseApp = app;
export const auth = authInstance; // This will be null if initialization failed or on server

export {
  GoogleAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut,
  type NextOrObserver,
  type User,
  type FirebaseAuthType,
  type ConfirmationResult
};
