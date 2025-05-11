
import { db, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, Timestamp, limit, writeBatch } from '@/lib/firebase';
import type { StaffMember, StaffRole } from '@/types';

const STAFF_COLLECTION = 'staffMembers';

const INITIAL_MOCK_STAFF: Omit<StaffMember, 'id'>[] = [
    { name: 'John Doe (Mechanic)', email: 'mechanic1@example.com', role: 'mechanic' },
    { name: 'Jane Smith (Customer Relations)', email: 'cr1@example.com', role: 'customer_relations' },
    // Add the admin user here if they should also be in the staffMembers collection for role lookup
    // { name: 'Admin User', email: 'husseinmalingha@gmail.com', role: 'admin' }, 
];

// Function to seed initial staff data if collection is empty
const seedInitialStaff = async () => {
  if (!db) {
    console.error("Firestore not initialized, skipping staff seeding.");
    return;
  }
  const staffCollectionRef = collection(db, STAFF_COLLECTION);
  const q = query(staffCollectionRef, limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.log("Staff collection is empty. Seeding initial staff...");
    const batch = writeBatch(db);
    INITIAL_MOCK_STAFF.forEach(staffMemberData => {
      const docRef = doc(collection(db, STAFF_COLLECTION)); // Auto-generate ID
      batch.set(docRef, { ...staffMemberData, email: staffMemberData.email.toLowerCase() });
    });
    await batch.commit();
    console.log("Initial staff seeded successfully.");
  }
};

// Call seeding when the module loads (or on first relevant function call)
if (typeof window !== 'undefined') { // Ensure this runs client-side
    seedInitialStaff().catch(console.error);
}


const staffFromDoc = (doc: DocumentSnapshot): StaffMember => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data?.name,
    email: data?.email,
    role: data?.role,
  } as StaffMember;
};

export const getStaffMemberById = async (staffId: string): Promise<StaffMember | null> => {
  if (!db) return null;
  const docRef = doc(db, STAFF_COLLECTION, staffId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? staffFromDoc(docSnap) : null;
};

export const getStaffMemberByEmail = async (email: string): Promise<StaffMember | null> => {
  if (!db) return null;
  const q = query(collection(db, STAFF_COLLECTION), where("email", "==", email.toLowerCase()), limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return staffFromDoc(querySnapshot.docs[0]);
  }
  return null;
};

export const getAllStaffMembers = async (): Promise<StaffMember[]> => {
  if (!db) return [];
  const querySnapshot = await getDocs(collection(db, STAFF_COLLECTION));
  return querySnapshot.docs.map(staffFromDoc);
};

export const addStaffMember = async (staffData: Omit<StaffMember, 'id'>): Promise<StaffMember> => {
  if (!db) throw new Error("Firestore not initialized");
  const dataToAdd = {
    ...staffData,
    email: staffData.email.toLowerCase(), // Ensure email is stored in lowercase
  };
  const docRef = await addDoc(collection(db, STAFF_COLLECTION), dataToAdd);
  return { ...dataToAdd, id: docRef.id };
};

export const updateStaffMember = async (staffId: string, staffData: Partial<Omit<StaffMember, 'id'>>): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, STAFF_COLLECTION, staffId);
  const dataToUpdate = { ...staffData };
  if (dataToUpdate.email) {
    dataToUpdate.email = dataToUpdate.email.toLowerCase();
  }
  await updateDoc(docRef, dataToUpdate);
};

export const deleteStaffMember = async (staffId: string): Promise<void> => {
  if (!db) throw new Error("Firestore not initialized");
  const docRef = doc(db, STAFF_COLLECTION, staffId);
  await deleteDoc(docRef);
};

export const listenToStaffMembers = (callback: (staff: StaffMember[]) => void): (() => void) => {
  if (!db) {
    console.error("Firestore not initialized. Cannot listen to staff members.");
    callback([]); // Call with empty array if DB is not available
    return () => {}; // Return a no-op unsubscribe function
  }
  const q = query(collection(db, STAFF_COLLECTION));
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const staffList = querySnapshot.docs.map(staffFromDoc);
    callback(staffList);
  }, (error) => {
    console.error("Error listening to staff members:", error);
    callback([]); // Call with empty array on error
  });
  return unsubscribe;
};
