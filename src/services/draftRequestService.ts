
// import { db, doc, getDoc, setDoc, deleteDoc, Timestamp } from '@/lib/firebase'; // Firebase imports removed
import type { DraftServiceRequestData, Location, VehicleInfo } from '@/types';

const LOCAL_STORAGE_DRAFT_KEY_PREFIX = 'resqDraftRequest_';

// Helper to get the user-specific key
const getUserDraftKey = (userId: string): string => `${LOCAL_STORAGE_DRAFT_KEY_PREFIX}${userId}`;

export const getDraftRequest = async (userId: string): Promise<DraftServiceRequestData | null> => {
  if (typeof window === 'undefined') return null;
  try {
    const userDraftKey = getUserDraftKey(userId);
    const draftJson = localStorage.getItem(userDraftKey);
    if (draftJson) {
      const draft = JSON.parse(draftJson) as DraftServiceRequestData;
      // Ensure date fields are correctly parsed if stored as ISO strings
      if (draft.lastUpdated && typeof draft.lastUpdated === 'string') {
        draft.lastUpdated = new Date(draft.lastUpdated);
      }
      return draft;
    }
    return null;
  } catch (error) {
    console.error("Error fetching draft request from localStorage:", error);
    return null;
  }
};

export const saveDraftRequest = async (userId: string, draftData: Partial<Omit<DraftServiceRequestData, 'userId' | 'lastUpdated'>>): Promise<void> => {
  if (typeof window === 'undefined') return;
  try {
    const userDraftKey = getUserDraftKey(userId);
    const existingDraft = await getDraftRequest(userId) || {};
    
    const dataToSave: DraftServiceRequestData = {
      ...existingDraft,
      ...draftData,
      userId, 
      lastUpdated: new Date(),
    };
    localStorage.setItem(userDraftKey, JSON.stringify(dataToSave));
  } catch (error) {
    console.error("Error saving draft request to localStorage:", error);
    // Not throwing error for localStorage issues as it's non-critical for some flows
  }
};

export const deleteDraftRequest = async (userId: string): Promise<void> => {
  if (typeof window === 'undefined') return;
  try {
    const userDraftKey = getUserDraftKey(userId);
    localStorage.removeItem(userDraftKey);
  } catch (error) {
    console.error("Error deleting draft request from localStorage:", error);
  }
};
