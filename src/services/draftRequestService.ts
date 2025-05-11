
import { db, doc, getDoc, setDoc, deleteDoc, Timestamp, type DocumentSnapshot } from '@/lib/firebase';
import type { DraftServiceRequestData } from '@/types';

const DRAFTS_COLLECTION = 'draftRequests';

const draftFromDoc = (docSnap: DocumentSnapshot, userId: string): DraftServiceRequestData => {
  const data = docSnap.data();
  if (!data) throw new Error("Document data is undefined!");

  const lastUpdated = data.lastUpdated instanceof Timestamp ? data.lastUpdated.toDate() : new Date(data.lastUpdated);

  return {
    userId: userId, // docSnap.id is the userId
    userLocation: data.userLocation,
    issueDescription: data.issueDescription,
    issueSummary: data.issueSummary,
    vehicleInfo: data.vehicleInfo,
    lastUpdated: lastUpdated,
  } as DraftServiceRequestData;
}

export const getDraftRequest = async (userId: string): Promise<DraftServiceRequestData | null> => {
  if (!db || !userId) return null;
  try {
    const docRef = doc(db, DRAFTS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return draftFromDoc(docSnap, userId);
    }
    return null;
  } catch (error) {
    console.error("Error fetching draft request from Firestore:", error);
    return null;
  }
};

export const saveDraftRequest = async (userId: string, draftData: Partial<Omit<DraftServiceRequestData, 'userId' | 'lastUpdated'>>): Promise<void> => {
  if (!db || !userId) return;
  try {
    const docRef = doc(db, DRAFTS_COLLECTION, userId);
    const dataToSave = {
      ...draftData,
      userId, 
      lastUpdated: Timestamp.fromDate(new Date()), // Always update with current server timestamp
    };
    // Using setDoc with merge: true to create or update the draft
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (error) {
    console.error("Error saving draft request to Firestore:", error);
  }
};

export const deleteDraftRequest = async (userId: string): Promise<void> => {
  if (!db || !userId) return;
  try {
    const docRef = doc(db, DRAFTS_COLLECTION, userId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting draft request from Firestore:", error);
  }
};
