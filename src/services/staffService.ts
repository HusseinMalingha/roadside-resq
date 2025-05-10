
import type { StaffMember, StaffRole } from '@/types';

const LOCAL_STORAGE_STAFF_KEY = 'resqStaffMembers';

// Mock initial staff for demo purposes if localStorage is empty
const INITIAL_MOCK_STAFF: StaffMember[] = [
    { id: 'staff-mech-1', name: 'John Doe (Mechanic)', email: 'mechanic1@example.com', role: 'mechanic' },
    { id: 'staff-cr-1', name: 'Jane Smith (Customer Relations)', email: 'cr1@example.com', role: 'customer_relations' },
];


const getAllLocalStaff = (): StaffMember[] => {
  if (typeof window === 'undefined') return [...INITIAL_MOCK_STAFF];
  const staffJson = localStorage.getItem(LOCAL_STORAGE_STAFF_KEY);
   if (staffJson) {
    return JSON.parse(staffJson);
  }
  // If nothing in local storage, seed with initial mock staff
  localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(INITIAL_MOCK_STAFF));
  return [...INITIAL_MOCK_STAFF];
};

const saveAllLocalStaff = (staff: StaffMember[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(staff));
};

export const getStaffMemberById = async (staffId: string): Promise<StaffMember | null> => {
  const allStaff = getAllLocalStaff();
  return Promise.resolve(allStaff.find(s => s.id === staffId) || null);
};

// This function is less meaningful with localStorage but kept for interface compatibility.
// It won't reflect a central database of staff.
export const getStaffMemberByEmail = async (email: string): Promise<StaffMember | null> => {
  const allStaff = getAllLocalStaff();
  return Promise.resolve(allStaff.find(s => s.email.toLowerCase() === email.toLowerCase()) || null);
};

export const getAllStaffMembers = async (): Promise<StaffMember[]> => {
  return Promise.resolve(getAllLocalStaff());
};

export const addStaffMember = async (staffData: Omit<StaffMember, 'id'>): Promise<StaffMember> => {
  const allStaff = getAllLocalStaff();
  const newStaff: StaffMember = {
    ...staffData,
    id: `local-staff-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    email: staffData.email.toLowerCase(),
  };
  allStaff.push(newStaff);
  saveAllLocalStaff(allStaff);
  return Promise.resolve(newStaff);
};

export const updateStaffMember = async (staffId: string, staffData: Partial<StaffMember>): Promise<void> => {
  let allStaff = getAllLocalStaff();
  const staffIndex = allStaff.findIndex(s => s.id === staffId);
  if (staffIndex !== -1) {
    const updatedStaffMember = { ...allStaff[staffIndex], ...staffData, id: staffId };
    if (updatedStaffMember.email) {
      updatedStaffMember.email = updatedStaffMember.email.toLowerCase();
    }
    allStaff[staffIndex] = updatedStaffMember;
    saveAllLocalStaff(allStaff);
  } else {
     console.warn(`Staff member with ID ${staffId} not found in localStorage for update.`);
  }
  return Promise.resolve();
};

export const deleteStaffMember = async (staffId: string): Promise<void> => {
  let allStaff = getAllLocalStaff();
  allStaff = allStaff.filter(s => s.id !== staffId);
  saveAllLocalStaff(allStaff);
  return Promise.resolve();
};

export const listenToStaffMembers = (callback: (staff: StaffMember[]) => void): (() => void) => {
  const currentStaff = getAllLocalStaff();
  callback(currentStaff);

  const storageListener = (event: StorageEvent) => {
    if (event.key === LOCAL_STORAGE_STAFF_KEY) {
      callback(getAllLocalStaff());
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
