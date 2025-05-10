
import { db, doc, getDoc, setDoc, deleteDoc, Timestamp } from '@/lib/firebase';
import type { DraftServiceRequestData, Location, VehicleInfo } from '@/types';

const DRAFT_REQUESTS_COLLECTION = 'userDraftRequests';

// Helper to convert Firestore Timestamps to Date objects for a draft request
const processDraftRequestDoc = (docSnap: any): DraftServiceRequestData | null => {
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    ...data,
    lastUpdated: data.lastUpdated ? (data.lastUpdated as Timestamp).toDate() : undefined,
  } as DraftServiceRequestData;
};

export const getDraftRequest = async (userId: string): Promise<DraftServiceRequestData | null> => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return null;
  }
  try {
    const draftDocRef = doc(db, DRAFT_REQUESTS_COLLECTION, userId);
    const docSnap = await getDoc(draftDocRef);
    return processDraftRequestDoc(docSnap);
  } catch (error) {
    console.error("Error fetching draft request:", error);
    // It's okay if a draft doesn't exist, so don't throw, just return null.
    return null;
  }
};

export const saveDraftRequest = async (userId: string, draftData: Partial<Omit<DraftServiceRequestData, 'userId' | 'lastUpdated'>>): Promise<void> => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return;
  }
  try {
    const draftDocRef = doc(db, DRAFT_REQUESTS_COLLECTION, userId);
    const dataToSave = {
      ...draftData,
      userId, // Ensure userId is part of the document data itself
      lastUpdated: Timestamp.now(),
    };
    await setDoc(draftDocRef, dataToSave, { merge: true }); // Use merge to update existing fields or create if not exists
  } catch (error) {
    console.error("Error saving draft request:", error);
    throw error; // Re-throw to allow caller to handle
  }
};

export const deleteDraftRequest = async (userId: string): Promise<void> => {
  if (!db) {
    console.error("Firestore is not initialized.");
    return;
  }
  try {
    const draftDocRef = doc(db, DRAFT_REQUESTS_COLLECTION, userId);
    await deleteDoc(draftDocRef);
  } catch (error) {
    console.error("Error deleting draft request:", error);
    // Don't throw if deleting fails, it's not critical for main flow usually
  }
};
