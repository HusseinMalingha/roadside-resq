
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
  type ConfirmationResult,
  getAdditionalUserInfo // This was imported but not re-exported
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  type Firestore,
  type DocumentData,
  type QuerySnapshot,
  type DocumentSnapshot,
  limit,
} from 'firebase/firestore';

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
let dbInstance: Firestore | null = null;

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
        dbInstance = getFirestore(app);
        console.log("Firebase initialized successfully with Auth and Firestore.");
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
        dbInstance = getFirestore(app);
    } else {
        console.error("Firebase app was expected to be initialized but is null.");
    }
  }
}

export const firebaseApp = app;
export const auth = authInstance; 
export const db = dbInstance; 

export {
  GoogleAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  limit,
  getAdditionalUserInfo, // Added getAdditionalUserInfo here
  type NextOrObserver,
  type User,
  type FirebaseAuthType,
  type ConfirmationResult,
  type Firestore,
  type DocumentData,
  type QuerySnapshot,
  type DocumentSnapshot
};

