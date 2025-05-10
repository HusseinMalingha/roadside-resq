
// src/lib/localStorageUtils.ts
import type { ServiceRequest, StaffMember } from '@/types';

export const LOCAL_STORAGE_REQUESTS_KEY = 'roadsideServiceRequests';
export const LOCAL_STORAGE_STAFF_KEY = 'garageStaffMembers';

export const getRequestsFromStorage = (): ServiceRequest[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const storedRequests = localStorage.getItem(LOCAL_STORAGE_REQUESTS_KEY);
    if (storedRequests) {
      return JSON.parse(storedRequests).map((req: any) => ({
        ...req,
        requestTime: new Date(req.requestTime), // Ensure requestTime is a Date object
        // Ensure vehicleInfo has defaults if missing, and other nested objects are fine
        vehicleInfo: req.vehicleInfo || { make: 'Unknown', model: 'Unknown', year: 'N/A', licensePlate: 'N/A' },
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
    const serializableRequests = requests.map(req => ({
      ...req,
      requestTime: req.requestTime.toISOString(),
    }));
    localStorage.setItem(LOCAL_STORAGE_REQUESTS_KEY, JSON.stringify(serializableRequests));
  } catch (error) {
    console.error("Error saving requests to localStorage:", error);
  }
};


export const getStaffMembersFromStorage = (): StaffMember[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const storedStaff = localStorage.getItem(LOCAL_STORAGE_STAFF_KEY);
    return storedStaff ? JSON.parse(storedStaff) : [];
  } catch (error) {
    console.error("Error reading staff members from localStorage:", error);
    return [];
  }
};

export const saveStaffMembersToStorage = (staffMembers: StaffMember[]): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(staffMembers));
  } catch (error) {
    console.error("Error saving staff members to localStorage:", error);
  }
};
