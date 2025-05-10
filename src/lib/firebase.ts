
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
  type Auth as FirebaseAuthType,
  type ConfirmationResult 
} from 'firebase/auth';
// Firestore related imports are removed

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
// let dbInstance: Firestore | null = null; // Firestore instance removed

const allConfigValuesPresent =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId;

if (typeof window !== 'undefined') { 
  if (!getApps().length) {
    if (allConfigValuesPresent) {
      try {
        app = initializeApp(firebaseConfig);
        authInstance = getAuth(app);
        // dbInstance = getFirestore(app); // Firestore initialization removed
        console.log("Firebase initialized successfully with Auth.");
      } catch (e) {
        console.error("Error initializing Firebase app:", e);
      }
    } else {
      console.error(
        'Firebase configuration is incomplete. Please check your .env file and ensure all NEXT_PUBLIC_FIREBASE_* variables are set. Firebase features will be disabled.'
      );
    }
  } else {
    app = getApp(); 
    if (app) { 
        authInstance = getAuth(app); 
        // dbInstance = getFirestore(app); // Firestore retrieval removed
    } else {
        console.error("Firebase app was expected to be initialized but is null.");
    }
  }
}

export const firebaseApp = app;
export const auth = authInstance; 
export const db = null; // Export null for db as Firestore is removed

export {
  GoogleAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut,
  // Firestore related exports are removed (collection, doc, getDoc, etc.)
  // Timestamp, // Timestamp is a Firestore type, remove if not used elsewhere
  type NextOrObserver,
  type User,
  type FirebaseAuthType,
  type ConfirmationResult
  // type Firestore // Firestore type removed
};

