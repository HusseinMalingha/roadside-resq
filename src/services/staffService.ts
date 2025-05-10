
import { db, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot } from '@/lib/firebase';
import type { StaffMember, StaffRole } from '@/types';

const STAFF_COLLECTION = 'staffMembers';

export const getStaffMemberById = async (staffId: string): Promise<StaffMember | null> => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return null;
  }
  try {
    const staffDocRef = doc(db, STAFF_COLLECTION, staffId);
    const staffDocSnap = await getDoc(staffDocRef);
    if (staffDocSnap.exists()) {
      return { id: staffDocSnap.id, ...staffDocSnap.data() } as StaffMember;
    }
    return null;
  } catch (error) {
    console.error("Error fetching staff member by ID:", error);
    throw error;
  }
};

export const getStaffMemberByEmail = async (email: string): Promise<StaffMember | null> => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return null;
  }
  try {
    const q = query(collection(db, STAFF_COLLECTION), where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const staffDoc = querySnapshot.docs[0];
      return { id: staffDoc.id, ...staffDoc.data() } as StaffMember;
    }
    return null;
  } catch (error) {
    console.error("Error fetching staff member by email:", error);
    throw error;
  }
};

export const getAllStaffMembers = async (): Promise<StaffMember[]> => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return [];
  }
  try {
    const staffCollectionRef = collection(db, STAFF_COLLECTION);
    const staffSnapshot = await getDocs(staffCollectionRef);
    return staffSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffMember));
  } catch (error) {
    console.error("Error fetching all staff members:", error);
    throw error;
  }
};

export const addStaffMember = async (staffData: Omit<StaffMember, 'id'>): Promise<StaffMember> => {
  if (!db) {
    console.error("Firestore is not initialized.");
    throw new Error("Firestore not initialized");
  }
  try {
    const docRef = await addDoc(collection(db, STAFF_COLLECTION), {
      ...staffData,
      email: staffData.email.toLowerCase(), // Store email in lowercase for consistent querying
    });
    return { id: docRef.id, ...staffData };
  } catch (error) {
    console.error("Error adding staff member:", error);
    throw error;
  }
};

export const updateStaffMember = async (staffId: string, staffData: Partial<StaffMember>): Promise<void> => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return;
  }
  try {
    const staffDocRef = doc(db, STAFF_COLLECTION, staffId);
    // If email is being updated, ensure it's stored in lowercase
    if (staffData.email) {
      staffData.email = staffData.email.toLowerCase();
    }
    await updateDoc(staffDocRef, staffData);
  } catch (error) {
    console.error("Error updating staff member:", error);
    throw error;
  }
};

export const deleteStaffMember = async (staffId: string): Promise<void> => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return;
  }
  try {
    const staffDocRef = doc(db, STAFF_COLLECTION, staffId);
    await deleteDoc(staffDocRef);
  } catch (error) {
    console.error("Error deleting staff member:", error);
    throw error;
  }
};

export const listenToStaffMembers = (callback: (staff: StaffMember[]) => void): (() => void) => {
  if (!db) {
    console.error("Firestore is not initialized. Cannot listen to staff members.");
    return () => {}; // Return an empty unsubscribe function
  }
  const staffCollectionRef = collection(db, STAFF_COLLECTION);
  const unsubscribe = onSnapshot(staffCollectionRef, (snapshot) => {
    const staffList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffMember));
    callback(staffList);
  }, (error) => {
    console.error("Error listening to staff members:", error);
  });
  return unsubscribe;
};
