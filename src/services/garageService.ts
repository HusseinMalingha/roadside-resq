
import { db, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, Timestamp } from '@/lib/firebase';
import type { ServiceProvider, Location } from '@/types';

const GARAGES_COLLECTION = 'garages';

// Initial default AutoXpress garage data - can be used for seeding if needed, but app relies on admin to add
const INITIAL_MOCK_PROVIDERS: ServiceProvider[] = [
  // Kampala Area
  { 
    id: 'ax-kampala-central', 
    name: 'Auto Xpress - Kampala Central', 
    phone: '(256) 772-123456', 
    etaMinutes: 15, 
    currentLocation: { lat: 0.3136, lng: 32.5811 }, 
    generalLocation: "Kampala Central (City Oil Kira Rd)",
    servicesOffered: ['Tire Services', 'Battery Replacement', 'Oil Change', 'Brake Services', 'Flat tire', 'Dead battery', 'Vehicle Diagnostics'] 
  },
  { 
    id: 'ax-lugogo', 
    name: 'Auto Xpress - Lugogo', 
    phone: '(256) 772-234567', 
    etaMinutes: 20, 
    currentLocation: { lat: 0.3270, lng: 32.5990 }, 
    generalLocation: "Lugogo (U-Save, Next to Forest Mall)",
    servicesOffered: ['Suspension Work', 'Diagnostics', 'Tire Alignment', 'Jump Start', 'Engine failure', 'Car Wash'] 
  },
  // ... (include other initial providers if you want to seed them, or remove this array if fully relying on admin input)
];


export const getAllGarages = async (): Promise<ServiceProvider[]> => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return [];
  }
  try {
    const garagesCollectionRef = collection(db, GARAGES_COLLECTION);
    const garageSnapshot = await getDocs(garagesCollectionRef);
    if (garageSnapshot.empty && process.env.NODE_ENV === 'development') {
      // Optional: Seed initial data in development if collection is empty
      // console.log("No garages found in Firestore. Seeding initial mock providers for development.");
      // for (const provider of INITIAL_MOCK_PROVIDERS) {
      //   // Use provider.id as document ID if it's unique and you want to control it
      //   // Otherwise, let Firestore generate IDs by using addDoc
      //   const docRef = doc(db, GARAGES_COLLECTION, provider.id);
      //   await setDoc(docRef, provider);
      // }
      // const seededSnapshot = await getDocs(garagesCollectionRef);
      // return seededSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceProvider));
      return []; // Return empty if not seeding or not in dev
    }
    return garageSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceProvider));
  } catch (error) {
    console.error("Error fetching all garages:", error);
    throw error;
  }
};

export const addGarage = async (garageData: Omit<ServiceProvider, 'id' | 'distanceKm'>): Promise<ServiceProvider> => {
  if (!db) {
    console.error("Firestore is not initialized.");
    throw new Error("Firestore not initialized");
  }
  try {
    const docRef = await addDoc(collection(db, GARAGES_COLLECTION), garageData);
    return { id: docRef.id, ...garageData };
  } catch (error) {
    console.error("Error adding garage:", error);
    throw error;
  }
};

export const updateGarage = async (garageId: string, garageData: Partial<Omit<ServiceProvider, 'id' | 'distanceKm'>>): Promise<void> => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return;
  }
  try {
    const garageDocRef = doc(db, GARAGES_COLLECTION, garageId);
    await updateDoc(garageDocRef, garageData);
  } catch (error) {
    console.error("Error updating garage:", error);
    throw error;
  }
};

export const deleteGarage = async (garageId: string): Promise<void> => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return;
  }
  try {
    const garageDocRef = doc(db, GARAGES_COLLECTION, garageId);
    await deleteDoc(garageDocRef);
  } catch (error) {
    console.error("Error deleting garage:", error);
    throw error;
  }
};

export const listenToGarages = (callback: (garages: ServiceProvider[]) => void): (() => void) => {
   if (!db) {
    console.error("Firestore is not initialized. Cannot listen to garages.");
    return () => {}; 
  }
  const garagesCollectionRef = collection(db, GARAGES_COLLECTION);
  const unsubscribe = onSnapshot(garagesCollectionRef, (snapshot) => {
    const garageList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceProvider));
    callback(garageList);
  }, (error) => {
    console.error("Error listening to garages:", error);
  });
  return unsubscribe;
};
