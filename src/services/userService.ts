
import { db, doc, getDoc, setDoc, Timestamp, type DocumentSnapshot } from '@/lib/firebase';
import type { UserProfile, VehicleInfo } from '@/types';

const USERS_COLLECTION = 'users';

const userProfileFromDoc = (docSnap: DocumentSnapshot): UserProfile | null => {
  const data = docSnap.data();
  if (!data) return null;

  return {
    uid: docSnap.id,
    email: data.email || null,
    displayName: data.displayName || null,
    photoURL: data.photoURL || null,
    phoneNumber: data.phoneNumber || null, // From Firebase Auth
    contactPhoneNumber: data.contactPhoneNumber || null,
    contactPhoneNumberConfirmed: data.contactPhoneNumberConfirmed || false, // Default to false if not set
    role: data.role || 'user',
    vehicleInfo: data.vehicleInfo || null,
    // lastLogin: data.lastLogin instanceof Timestamp ? data.lastLogin.toDate() : new Date(data.lastLogin), // Example
  } as UserProfile;
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!db || !userId) {
    console.error("Get User Profile: Firestore not initialized or userId missing.");
    return null;
  }
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return userProfileFromDoc(docSnap);
    }
    return null; // User profile doesn't exist yet
  } catch (error) {
    console.error("Error fetching user profile from Firestore:", error);
    throw error; // Re-throw to be caught by caller
  }
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<void> => {
  if (!db || !userId) {
    console.error("Update User Profile: Firestore not initialized or userId missing.");
    throw new Error("Firestore not initialized or userId missing.");
  }
  try {
    const userProfileRef = doc(db, USERS_COLLECTION, userId);
    const dataToSet = { ...data };
    if (!dataToSet.uid) dataToSet.uid = userId; 

    // If contactPhoneNumber is being set, and contactPhoneNumberConfirmed is not explicitly passed,
    // and the new contactPhoneNumber is different from an existing one, confirmation might be needed.
    // However, for simplicity, we'll assume `contactPhoneNumberConfirmed` is managed explicitly.
    // If contactPhoneNumber is being set to a new value, contactPhoneNumberConfirmed should ideally be set to false
    // unless it's part of the confirmation flow.

    if (dataToSet.contactPhoneNumber !== undefined && dataToSet.contactPhoneNumberConfirmed === undefined) {
        // If setting/changing contactPhoneNumber and not explicitly confirming, mark as unconfirmed
        // unless it's being cleared to null.
        // This logic is now primarily handled by the modal flow itself.
        // dataToSet.contactPhoneNumberConfirmed = dataToSet.contactPhoneNumber ? false : dataToSet.contactPhoneNumberConfirmed;
    }


    await setDoc(userProfileRef, dataToSet, { merge: true });
  } catch (error) {
    console.error("Error updating user profile in Firestore:", error);
    throw error; // Re-throw to be caught by caller
  }
};

// Example of a more specific update, e.g., just for vehicle info
export const updateUserVehicleInfo = async (userId: string, vehicleInfo: VehicleInfo | null): Promise<void> => {
   if (!db || !userId) {
    console.error("Update Vehicle Info: Firestore not initialized or userId missing.");
    throw new Error("Firestore not initialized or userId missing.");
  }
  try {
    const userProfileRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userProfileRef, { vehicleInfo }, { merge: true });
  } catch (error) {
    console.error("Error updating user vehicle info in Firestore:", error);
    throw error;
  }
};

export const updateUserContactPhoneNumber = async (userId: string, contactPhoneNumber: string | null, confirmed: boolean): Promise<void> => {
   if (!db || !userId) {
    console.error("Update Contact Phone: Firestore not initialized or userId missing.");
    throw new Error("Firestore not initialized or userId missing.");
  }
  try {
    const userProfileRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userProfileRef, { contactPhoneNumber, contactPhoneNumberConfirmed: confirmed }, { merge: true });
  } catch (error) {
    console.error("Error updating user contact phone number in Firestore:", error);
    throw error;
  }
};
