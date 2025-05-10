
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
  generalLocation: string; // e.g., "Kampala Central", "Ntinda", "Entebbe Town"
  servicesOffered: string[];
  distanceKm?: number; // Optional, calculated dynamically
}

export interface ServiceRequest {
  id: string;
  requestId: string; // A more user-friendly request ID
  userLocation: Location;
  issueDescription: string;
  issueSummary: string;
  selectedProvider: ServiceProvider;
  requestTime: Date;
  status: 'Pending' | 'Accepted' | 'In Progress' | 'Completed' | 'Cancelled';
  userName: string; // User's name, from auth or manual input
  userPhone: string; // User's contact, from auth or manual input
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
