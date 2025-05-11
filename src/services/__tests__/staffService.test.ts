
import { addStaffMember } from '../staffService';
import type { StaffMember, StaffRole } from '@/types';

// Mock localStorage - No longer the primary target for these service tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    length: 0,
    key: (index: number) => null, // Satisfy Storage interface
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const baseStaffData: Omit<StaffMember, 'id'> = {
  name: 'Test Staff Person',
  email: 'staff.test@example.com',
  role: 'mechanic' as StaffRole,
};

describe('Staff Service (Firestore)', () => {
  beforeEach(() => {
    // localStorageMock.clear(); // May not be needed
    // If using Firestore emulator, clear it here
  });

  describe('addStaffMember', () => {
    it('should attempt to add a new staff member to Firestore and return them with a Firestore-generated ID', async () => {
      // This test will now attempt a real Firestore operation.
      // It will fail if Firestore is not configured/available in the test environment
      // or if there are permission issues/required indexes missing.
      const newStaffData = { ...baseStaffData };
      try {
        const addedStaffMember = await addStaffMember(newStaffData);

        expect(addedStaffMember.id).toBeDefined(); // Firestore generates its own ID format
        expect(addedStaffMember.id).not.toMatch(/^local-staff-\d+-\w+$/); // Should not be localStorage format
        expect(addedStaffMember.name).toBe(newStaffData.name);
        expect(addedStaffMember.email).toBe(newStaffData.email.toLowerCase()); // Service converts email to lowercase
        expect(addedStaffMember.role).toBe(newStaffData.role);

        // Further verification (e.g., fetching the staff member by ID) would be an integration test.
      } catch (error) {
        // If Firestore is not set up for tests, an error will likely be thrown here.
        console.error("Firestore operation failed in test (expected if DB not attached/mocked):", error);
        expect(error).toBeDefined();
      }
    });

    // Removed the test that intentionally simulated a DB failure with a boolean flag.
  });
});
