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
  userName?: string; // Optional: User's name
  userPhone?: string; // Optional: User's contact
}
