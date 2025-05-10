
// src/lib/localStorageUtils.ts
import type { ServiceRequest } from '@/types';

export const LOCAL_STORAGE_REQUESTS_KEY = 'roadsideServiceRequests';

export const getRequestsFromStorage = (): ServiceRequest[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const storedRequests = localStorage.getItem(LOCAL_STORAGE_REQUESTS_KEY);
    if (storedRequests) {
      // Ensure dates are properly parsed
      return JSON.parse(storedRequests).map((req: any) => ({
        ...req,
        requestTime: new Date(req.requestTime),
      }));
    }
    return [];
  } catch (error) {
    console.error("Error reading requests from localStorage:", error);
    return [];
  }
};

export const saveRequestsToStorage = (requests: ServiceRequest[]): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    // Ensure dates are stored in a serializable format (ISO string)
    const serializableRequests = requests.map(req => ({
      ...req,
      requestTime: req.requestTime.toISOString(),
    }));
    localStorage.setItem(LOCAL_STORAGE_REQUESTS_KEY, JSON.stringify(serializableRequests));
  } catch (error) {
    console.error("Error saving requests to localStorage:", error);
  }
};
