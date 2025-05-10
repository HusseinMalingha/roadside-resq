
import { db, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, Timestamp } from '@/lib/firebase';
import type { ServiceRequest, Location, VehicleInfo, ServiceProvider } from '@/types';

const REQUESTS_COLLECTION = 'serviceRequests';

// Helper to convert Firestore Timestamps to Date objects for a single request
const processRequestDoc = (docSnap: any): ServiceRequest => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    requestTime: (data.requestTime as Timestamp).toDate(),
    // Ensure nested objects like vehicleInfo and selectedProvider are correctly structured
    vehicleInfo: data.vehicleInfo || { make: 'Unknown', model: 'Unknown', year: 'N/A', licensePlate: 'N/A' },
    selectedProvider: data.selectedProvider || { id: 'unknown', name: 'Unknown Provider', phone: 'N/A', etaMinutes: 0, currentLocation: {lat:0,lng:0}, generalLocation: 'Unknown', servicesOffered:[]},
  } as ServiceRequest;
};


export const getAllRequests = async (): Promise<ServiceRequest[]> => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return [];
  }
  try {
    const q = query(collection(db, REQUESTS_COLLECTION), orderBy("requestTime", "desc"));
    const requestSnapshot = await getDocs(q);
    return requestSnapshot.docs.map(processRequestDoc);
  } catch (error) {
    console.error("Error fetching all requests:", error);
    throw error;
  }
};

export const getUserRequests = async (userId: string): Promise<ServiceRequest[]> => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return [];
  }
  try {
    const q = query(
      collection(db, REQUESTS_COLLECTION),
      where("userId", "==", userId),
      orderBy("requestTime", "desc")
    );
    const requestSnapshot = await getDocs(q);
    return requestSnapshot.docs.map(processRequestDoc);
  } catch (error) {
    console.error("Error fetching user requests:", error);
    throw error;
  }
}

export const addServiceRequest = async (requestData: Omit<ServiceRequest, 'id' | 'requestTime'> & { requestTime: Date }): Promise<ServiceRequest> => {
  if (!db) {
    console.error("Firestore is not initialized.");
    throw new Error("Firestore not initialized");
  }
  try {
    const dataToSave = {
      ...requestData,
      requestTime: Timestamp.fromDate(requestData.requestTime), // Convert Date to Firestore Timestamp
    };
    const docRef = await addDoc(collection(db, REQUESTS_COLLECTION), dataToSave);
    // Return the full request object including the generated ID and original Date object for requestTime
    return { ...requestData, id: docRef.id }; 
  } catch (error) {
    console.error("Error adding service request:", error);
    throw error;
  }
};

export const updateServiceRequest = async (requestId: string, requestData: Partial<Omit<ServiceRequest, 'id' | 'requestTime'>>): Promise<void> => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return;
  }
  try {
    const requestDocRef = doc(db, REQUESTS_COLLECTION, requestId);
    await updateDoc(requestDocRef, requestData);
  } catch (error) {
    console.error("Error updating service request:", error);
    throw error;
  }
};


export const listenToRequests = (callback: (requests: ServiceRequest[]) => void): (() => void) => {
  if (!db) {
    console.error("Firestore is not initialized. Cannot listen to requests.");
    return () => {}; 
  }
  const q = query(collection(db, REQUESTS_COLLECTION), orderBy("requestTime", "desc"));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const requestList = snapshot.docs.map(processRequestDoc);
    callback(requestList);
  }, (error) => {
    console.error("Error listening to requests:", error);
  });
  return unsubscribe;
};

export const listenToRequestById = (requestId: string, callback: (request: ServiceRequest | null) => void): (() => void) => {
  if (!db) {
    console.error("Firestore is not initialized. Cannot listen to request by ID.");
    return () => {};
  }
  const requestDocRef = doc(db, REQUESTS_COLLECTION, requestId);
  const unsubscribe = onSnapshot(requestDocRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(processRequestDoc(docSnap));
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`Error listening to request ${requestId}:`, error);
  });
  return unsubscribe;
};
