
export interface Location {
  lat: number;
  lng: number;
}

export interface ServiceProvider {
  id: string;
  name: string;
  phone: string;
  etaMinutes: number; // Can be a default or manually set for new garages
  currentLocation: Location; // lat, lng
  generalLocation: string; // e.g., "Kampala Central", "Ntinda", "Entebbe Town"
  servicesOffered: string[];
  distanceKm?: number; // Optional, calculated dynamically
  isCustom?: boolean; // Optional: to distinguish seeded from admin-added
}

export interface VehicleInfo {
  make: string;
  model: string;
  year: string;
  licensePlate: string;
}

export type StaffRole = 'mechanic' | 'customer_relations';

export interface StaffMember {
  id: string; // Unique identifier for the staff member (e.g., UUID)
  name: string;
  email: string; // Email of the staff member, can be used for matching with Firebase User
  role: StaffRole;
}

export interface ServiceRequest {
  id: string;
  requestId: string; // A more user-friendly request ID
  userId: string; // Firebase UID of the user who made the request
  userLocation: Location;
  issueDescription: string;
  issueSummary: string;
  selectedProvider: ServiceProvider;
  requestTime: Date;
  status: 'Pending' | 'Accepted' | 'In Progress' | 'Completed' | 'Cancelled';
  userName: string; // User's name, from auth or manual input
  userPhone: string; // User's contact, from auth or manual input
  vehicleInfo?: VehicleInfo;
  assignedStaffId?: string; // ID of the StaffMember (mechanic) assigned to this request
  mechanicNotes?: string; // Notes logged by the mechanic about the issue
  resourcesUsed?: string; // Resources/parts used by the mechanic
}

// Optional: Define a user profile type if you store more user data
export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  // Add any other custom fields you might store
}

export interface DraftServiceRequestData {
  userId: string;
  userLocation?: Location | null;
  issueDescription?: string;
  issueSummary?: string;
  vehicleInfo?: VehicleInfo | null;
  lastUpdated?: Date;
}

