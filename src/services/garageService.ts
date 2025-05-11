
import { db, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, Timestamp, limit, writeBatch } from '@/lib/firebase';
import type { ServiceProvider, Location } from '@/types';

const GARAGES_COLLECTION = 'serviceProviders';

const INITIAL_MOCK_PROVIDERS: Omit<ServiceProvider, 'id' | 'distanceKm'>[] = [
  { 
    name: 'Auto Xpress - Kampala Central', 
    phone: '(256) 772-123456', 
    etaMinutes: 15, 
    currentLocation: { lat: 0.3136, lng: 32.5811 }, 
    generalLocation: "Kampala Central (City Oil Kira Rd)",
    servicesOffered: ['Tire Services', 'Battery Replacement', 'Oil Change', 'Brake Services', 'Flat tire', 'Dead battery', 'Vehicle Diagnostics'],
    isCustom: false,
  },
  { 
    name: 'Auto Xpress - Lugogo', 
    phone: '(256) 772-234567', 
    etaMinutes: 20, 
    currentLocation: { lat: 0.3270, lng: 32.5990 }, 
    generalLocation: "Lugogo (U-Save, Next to Forest Mall)",
    servicesOffered: ['Suspension Work', 'Diagnostics', 'Tire Alignment', 'Jump Start', 'Engine failure', 'Car Wash'],
    isCustom: false,
  },
  {
    name: 'Auto Xpress - Entebbe',
    phone: '(256) 772-345678',
    etaMinutes: 45,
    currentLocation: { lat: 0.0476, lng: 32.4606 },
    generalLocation: "Entebbe Town (Shell Petrol Station)",
    servicesOffered: ['Tire Services', 'Battery Check', 'Oil Top-up', 'Flat tire'],
    isCustom: false,
  },
  {
    name: 'Auto Xpress - Mukono',
    phone: '(256) 772-456789',
    etaMinutes: 60,
    currentLocation: { lat: 0.3550, lng: 32.7500 },
    generalLocation: "Mukono (Near Total Petrol Station)",
    servicesOffered: ['General Repair', 'Tire Puncture', 'Jump Start', 'Engine failure'],
    isCustom: false,
  },
  {
    name: 'Auto Xpress - Jinja',
    phone: '(256) 772-567890',
    etaMinutes: 90,
    currentLocation: { lat: 0.4322, lng: 33.2040 },
    generalLocation: "Jinja Town (Main Street)",
    servicesOffered: ['Full Service', 'Tire Replacement', 'Battery Replacement', 'Vehicle Diagnostics'],
    isCustom: false,
  },
  {
    name: 'Auto Xpress - Mbarara',
    phone: '(256) 772-678901',
    etaMinutes: 180,
    currentLocation: { lat: -0.6070, lng: 30.6500 },
    generalLocation: "Mbarara Town (High Street)",
    servicesOffered: ['Major Repairs', 'Tire Services', 'Oil Change', 'Dead battery'],
    isCustom: false,
  }
];

// Function to seed initial garage data if collection is empty
const seedInitialGarages = async () => {
  if (!db) {
    console.error("Firestore not initialized, skipping garage seeding.");
    return;
  }
  const garageCollectionRef = collection(db, GARAGES_COLLECTION);
  const q = query(garageCollectionRef, limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.log("Garages collection is empty. Seeding initial providers...");
    const batch = writeBatch(db);
    INITIAL_MOCK_PROVIDERS.forEach(providerData => {
      const docRef = doc(collection(db, GARAGES_COLLECTION)); // Auto-generate ID
      batch.set(docRef, providerData);
    });
    await batch.commit();
    console.log("Initial garages seeded successfully.");
  }
};

if (typeof window !== 'undefined') {
    seedInitialGarages().catch(console.error);
}

const garageFromDoc = (doc: DocumentSnapshot): ServiceProvider => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data?.name,
    phone: data?.phone,
    etaMinutes: data?.etaMinutes,
    currentLocation: data?.currentLocation,
    generalLocation: data?.generalLocation,
    servicesOffered: data?.servicesOffered,
    isCustom: data?.isCustom,
  } as ServiceProvider;
};

export const getAllGarages = async (): Promise<ServiceProvider[]> => {
  if (!db) return [];
  const querySnapshot = await getDocs(collection(db, GARAGES_COLLECTION));
  return querySnapshot.docs.map(garageFromDoc);
};

export const addGarage = async (garageData: Omit<ServiceProvider, 'id' | 'distanceKm'>): Promise<ServiceProvider> => {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = await addDoc(collection(db, GARAGES_COLLECTION), garageData);
  return { ...garageData, id: docRef.id };
};

export const updateGarage = async (garageId: string, garageData: Partial<Omit<ServiceProvider, 'id' | 'distanceKm'>>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, GARAGES_COLLECTION, garageId);
  await updateDoc(docRef, garageData);
};

export const deleteGarage = async (garageId: string): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, GARAGES_COLLECTION, garageId);
  await deleteDoc(docRef);
};

export const listenToGarages = (callback: (garages: ServiceProvider[]) => void): (() => void) => {
  if (!db) {
    console.error("Firestore not initialized. Cannot listen to garages.");
    callback([]);
    return () => {};
  }
  const q = query(collection(db, GARAGES_COLLECTION));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const garagesList = querySnapshot.docs.map(garageFromDoc);
    callback(garagesList);
  }, (error) => {
    console.error("Error listening to garages:", error);
    callback([]);
  });
  return unsubscribe;
};
