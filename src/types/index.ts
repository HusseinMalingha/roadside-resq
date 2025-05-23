
import type { Timestamp } from 'firebase/firestore';

export interface Location {
  lat: number;
  lng: number;
}

export interface ServiceProvider {
  id: string;
  name: string;
  phone: string;
  etaMinutes: number; 
  currentLocation: Location; 
  generalLocation: string; 
  servicesOffered: string[];
  distanceKm?: number; 
  isCustom?: boolean; 
}

export interface VehicleInfo {
  make: string;
  model: string;
  year: string;
  licensePlate: string;
}

export type StaffRole = 'admin' | 'mechanic' | 'customer_relations' | 'user'; // Added 'admin' and 'user' for clarity

export interface StaffMember {
  id: string; 
  name: string;
  email: string; 
  role: StaffRole;
}

export interface ServiceRequest {
  id: string;
  requestId: string; 
  userId: string; 
  userLocation: Location;
  issueDescription: string;
  issueSummary: string;
  selectedProvider: ServiceProvider; // Embed for easy display, store providerId for relations
  selectedProviderId: string; // ID of the selected ServiceProvider
  requestTime: Date | Timestamp; // Date for app, Timestamp for Firestore
  status: 'Pending' | 'Accepted' | 'In Progress' | 'Completed' | 'Cancelled';
  userName: string; 
  userPhone: string; 
  vehicleInfo?: VehicleInfo;
  assignedStaffId?: string; 
  mechanicNotes?: string; 
  resourcesUsed?: string; 
  cancellationRequested?: boolean;
  cancellationReason?: string;
  cancellationResponse?: string; // For admin/mechanic response to cancellation
  statusBeforeCancellation?: ServiceRequest['status']; // To store status before user requests cancellation
}

export interface UserProfile {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null; // From Firebase Auth (usually verified)
  contactPhoneNumber?: string | null; // User-provided, editable contact number
  contactPhoneNumberConfirmed?: boolean; // True if user has confirmed/provided this number
  role: StaffRole; 
  vehicleInfo?: VehicleInfo | null; // User's default vehicle
  // lastLogin: Timestamp; // Example
}

export interface DraftServiceRequestData {
  userId: string;
  userLocation?: Location | null;
  issueDescription?: string;
  issueSummary?: string;
  vehicleInfo?: VehicleInfo | null;
  lastUpdated?: Date | Timestamp; // Date for app, Timestamp for Firestore
}


