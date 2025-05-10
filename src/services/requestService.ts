
import type { ServiceRequest, Location, VehicleInfo, ServiceProvider } from '@/types';

const LOCAL_STORAGE_REQUESTS_KEY = 'resqServiceRequests';

// Helper to get all requests from local storage
const getAllLocalRequests = (): ServiceRequest[] => {
  if (typeof window === 'undefined') return [];
  const requestsJson = localStorage.getItem(LOCAL_STORAGE_REQUESTS_KEY);
  return requestsJson ? JSON.parse(requestsJson) : [];
};

// Helper to save all requests to local storage
const saveAllLocalRequests = (requests: ServiceRequest[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_REQUESTS_KEY, JSON.stringify(requests));
};

export const getAllRequests = async (): Promise<ServiceRequest[]> => {
  // Simulates async behavior, though localStorage is synchronous
  return Promise.resolve(getAllLocalRequests().sort((a,b) => new Date(b.requestTime).getTime() - new Date(a.requestTime).getTime()));
};

export const getUserRequests = async (userId: string): Promise<ServiceRequest[]> => {
  const allRequests = getAllLocalRequests();
  return Promise.resolve(
    allRequests
      .filter(req => req.userId === userId)
      .sort((a,b) => new Date(b.requestTime).getTime() - new Date(a.requestTime).getTime())
  );
};

export const addServiceRequest = async (requestData: Omit<ServiceRequest, 'id' | 'requestTime'> & { requestTime: Date }): Promise<ServiceRequest> => {
  const allRequests = getAllLocalRequests();
  const newRequest: ServiceRequest = {
    ...requestData,
    id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Generate a local ID
    requestTime: new Date(requestData.requestTime), // Ensure it's a Date object
  };
  allRequests.push(newRequest);
  saveAllLocalRequests(allRequests);
  return Promise.resolve(newRequest);
};

export const updateServiceRequest = async (requestId: string, requestData: Partial<Omit<ServiceRequest, 'id' | 'requestTime'>>): Promise<void> => {
  let allRequests = getAllLocalRequests();
  const requestIndex = allRequests.findIndex(req => req.id === requestId);
  if (requestIndex !== -1) {
    allRequests[requestIndex] = { ...allRequests[requestIndex], ...requestData };
    saveAllLocalRequests(allRequests);
  } else {
    console.warn(`Request with ID ${requestId} not found in localStorage for update.`);
  }
  return Promise.resolve();
};

// Real-time listeners are not feasible with localStorage in the same way as Firestore.
// These functions are now stubs or will trigger a manual re-fetch if components need to update.
// For a true reactive system with localStorage, custom event emitters or a state management library would be needed.

export const listenToRequests = (callback: (requests: ServiceRequest[]) => void): (() => void) => {
  // This will just provide the current snapshot. No real-time updates.
  const currentRequests = getAllLocalRequests().sort((a,b) => new Date(b.requestTime).getTime() - new Date(a.requestTime).getTime());
  callback(currentRequests);
  
  // To somewhat simulate, you could listen to storage events, but it's limited.
  const storageListener = (event: StorageEvent) => {
    if (event.key === LOCAL_STORAGE_REQUESTS_KEY) {
      const updatedRequests = getAllLocalRequests().sort((a,b) => new Date(b.requestTime).getTime() - new Date(a.requestTime).getTime());
      callback(updatedRequests);
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', storageListener);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', storageListener);
    }
  };
};

export const listenToRequestById = (requestId: string, callback: (request: ServiceRequest | null) => void): (() => void) => {
  const allRequests = getAllLocalRequests();
  const request = allRequests.find(req => req.id === requestId) || null;
  callback(request);

  const storageListener = (event: StorageEvent) => {
    if (event.key === LOCAL_STORAGE_REQUESTS_KEY) {
      const updatedRequests = getAllLocalRequests();
      const updatedRequest = updatedRequests.find(req => req.id === requestId) || null;
      callback(updatedRequest);
    }
  };
    if (typeof window !== 'undefined') {
    window.addEventListener('storage', storageListener);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', storageListener);
    }
  };
};
