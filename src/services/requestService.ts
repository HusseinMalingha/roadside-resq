import { db, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, Timestamp, type DocumentSnapshot, limit } from '@/lib/firebase';
import type { ServiceRequest, Location, VehicleInfo, ServiceProvider } from '@/types';

const REQUESTS_COLLECTION = 'serviceRequests';

const requestFromDoc = (docSnap: DocumentSnapshot): ServiceRequest => {
  const data = docSnap.data();
  if (!data) throw new Error("Document data is undefined!");

  // Convert Firestore Timestamps to JS Date objects
  const requestTime = data.requestTime instanceof Timestamp ? data.requestTime.toDate() : new Date(data.requestTime);
  
  return {
    id: docSnap.id,
    requestId: data.requestId,
    userId: data.userId,
    userLocation: data.userLocation,
    issueDescription: data.issueDescription,
    issueSummary: data.issueSummary,
    selectedProvider: data.selectedProvider, // Assumes ServiceProvider is stored directly
    selectedProviderId: data.selectedProviderId,
    requestTime: requestTime,
    status: data.status,
    userName: data.userName,
    userPhone: data.userPhone,
    vehicleInfo: data.vehicleInfo,
    assignedStaffId: data.assignedStaffId,
    mechanicNotes: data.mechanicNotes,
    resourcesUsed: data.resourcesUsed,
    cancellationRequested: data.cancellationRequested,
    cancellationReason: data.cancellationReason,
    cancellationResponse: data.cancellationResponse,
    statusBeforeCancellation: data.statusBeforeCancellation,
  } as ServiceRequest;
};


export const getAllRequests = async (): Promise<ServiceRequest[]> => {
  if (!db) return [];
  const q = query(collection(db, REQUESTS_COLLECTION), orderBy('requestTime', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(requestFromDoc);
};

export const getUserRequests = async (userId: string): Promise<ServiceRequest[]> => {
  if (!db) return [];
  const q = query(
    collection(db, REQUESTS_COLLECTION),
    where('userId', '==', userId),
    where('status', 'in', ['Completed', 'Cancelled']), // Fetch completed and cancelled requests
    orderBy('requestTime', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(requestFromDoc);
};

export const addServiceRequest = async (requestData: Omit<ServiceRequest, 'id' | 'requestTime'> & { requestTime: Date }): Promise<ServiceRequest> => {
  if (!db) throw new Error("Firestore not initialized");
  
  const dataToSave = {
    ...requestData,
    requestTime: Timestamp.fromDate(new Date(requestData.requestTime)), // Convert JS Date to Firestore Timestamp
    selectedProviderId: requestData.selectedProvider.id, // Store ID for querying if needed
  };

  const docRef = await addDoc(collection(db, REQUESTS_COLLECTION), dataToSave);
  return { ...requestData, id: docRef.id, requestTime: new Date(requestData.requestTime) }; // Return with JS Date
};

export const updateServiceRequest = async (requestId: string, requestData: Partial<Omit<ServiceRequest, 'id' | 'requestTime'>>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, REQUESTS_COLLECTION, requestId);
  
  const dataToUpdate: Partial<any> = { ...requestData };
  // Convert any Date fields to Timestamps if they exist in requestData
  if (requestData.requestTime && requestData.requestTime instanceof Date) {
    dataToUpdate.requestTime = Timestamp.fromDate(requestData.requestTime);
  }

  await updateDoc(docRef, dataToUpdate);
};

export const listenToRequests = (callback: (requests: ServiceRequest[]) => void): (() => void) => {
  if (!db) {
    console.error("Firestore not initialized. Cannot listen to requests.");
    callback([]);
    return () => {};
  }
  const q = query(collection(db, REQUESTS_COLLECTION), orderBy('requestTime', 'desc'));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const requestsList = querySnapshot.docs.map(requestFromDoc);
    callback(requestsList);
  }, (error) => {
    console.error("Error listening to service requests:", error);
    callback([]);
  });
  return unsubscribe;
};

export const listenToRequestById = (requestId: string, callback: (request: ServiceRequest | null) => void): (() => void) => {
  if (!db) {
    console.error("Firestore not initialized. Cannot listen to request by ID.");
    callback(null);
    return () => {};
  }
  const docRef = doc(db, REQUESTS_COLLECTION, requestId);
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(requestFromDoc(docSnap));
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`Error listening to service request ${requestId}:`, error);
    callback(null);
  });
  return unsubscribe;
};

export const listenToRequestsForUser = (
  userId: string,
  callback: (requests: ServiceRequest[]) => void
): (() => void) => {
  if (!db) {
    console.error("Firestore not initialized. Cannot listen to requests for user.");
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, REQUESTS_COLLECTION),
    where("userId", "==", userId),
    where('status', 'in', ['Completed', 'Cancelled']), // Listen to completed and cancelled requests
    orderBy("requestTime", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const requestsList = querySnapshot.docs.map(requestFromDoc);
      callback(requestsList);
    },
    (error) => {
      console.error("Error listening to service requests for user:", error);
      // Firestore error details are often in error.code and error.message
      console.error("Firebase error code:", (error as any).code);
      console.error("Firebase error message:", (error as any).message);
      callback([]);
    }
  );

  return unsubscribe;
};


export const getActiveUserRequest = async (userId: string): Promise<ServiceRequest | null> => {
  if (!db) return null;
  const q = query(
    collection(db, REQUESTS_COLLECTION),
    where('userId', '==', userId),
    where('status', 'in', ['Pending', 'Accepted', 'In Progress']),
    orderBy('requestTime', 'desc'),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return requestFromDoc(querySnapshot.docs[0]);
  }
  return null;
};

export const listenToActiveUserRequest = (
  userId: string,
  callback: (request: ServiceRequest | null) => void
): (() => void) => {
  if (!db) {
    console.error("Firestore not initialized. Cannot listen to active user request.");
    callback(null);
    return () => {};
  }

  const q = query(
    collection(db, REQUESTS_COLLECTION),
    where('userId', '==', userId),
    where('status', 'in', ['Pending', 'Accepted', 'In Progress']), // Only listen to requests that are not completed or cancelled by garage
    orderBy('requestTime', 'desc'),
    limit(1)
  );

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      if (!querySnapshot.empty) {
        callback(requestFromDoc(querySnapshot.docs[0]));
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("Error listening to active user request:", error);
      callback(null);
    }
  );
  return unsubscribe;
};


export const requestCancellation = async (requestId: string, reason: string): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, REQUESTS_COLLECTION, requestId);
  const currentRequestSnap = await getDoc(docRef);
  if (!currentRequestSnap.exists()) throw new Error("Request not found");
  const currentRequestData = currentRequestSnap.data() as ServiceRequest;

  await updateDoc(docRef, {
    cancellationRequested: true,
    cancellationReason: reason,
    statusBeforeCancellation: currentRequestData.status, // Store current status
    status: 'Pending', // Change status to Pending to signify cancellation request needs review
  });
};

export const respondToCancellationRequest = async (
  requestId: string,
  approved: boolean,
  responseNotes?: string
): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, REQUESTS_COLLECTION, requestId);
  const currentRequestSnap = await getDoc(docRef);
  if (!currentRequestSnap.exists()) throw new Error("Request not found");
  const currentRequestData = currentRequestSnap.data() as ServiceRequest;

  const updateData: Partial<ServiceRequest> = {
    cancellationRequested: false, // Clear the request flag
    cancellationResponse: responseNotes || (approved ? "Cancellation approved." : "Cancellation denied."),
  };

  if (approved) {
    updateData.status = 'Cancelled';
  } else {
    // Revert to original status if not approved
    updateData.status = currentRequestData.statusBeforeCancellation || 'Pending'; 
  }
  updateData.statusBeforeCancellation = undefined; // Clear this field

  await updateDoc(docRef, updateData);
};
