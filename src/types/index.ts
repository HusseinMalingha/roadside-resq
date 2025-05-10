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
  servicesOffered: string[];
  distanceKm?: number; // Optional, calculated dynamically
}
