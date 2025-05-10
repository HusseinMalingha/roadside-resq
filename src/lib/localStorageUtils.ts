
// src/lib/localStorageUtils.ts
import type { ServiceRequest, StaffMember, ServiceProvider } from '@/types';

export const LOCAL_STORAGE_REQUESTS_KEY = 'roadsideServiceRequests';
export const LOCAL_STORAGE_STAFF_KEY = 'garageStaffMembers';
export const LOCAL_STORAGE_GARAGES_KEY = 'garageServiceProviders';

// Initial default AutoXpress garage data
const INITIAL_MOCK_PROVIDERS: ServiceProvider[] = [
  // Kampala Area
  { 
    id: 'ax-kampala-central', 
    name: 'Auto Xpress - Kampala Central', 
    phone: '(256) 772-123456', 
    etaMinutes: 15, 
    currentLocation: { lat: 0.3136, lng: 32.5811 }, 
    generalLocation: "Kampala Central (City Oil Kira Rd)",
    servicesOffered: ['Tire Services', 'Battery Replacement', 'Oil Change', 'Brake Services', 'Flat tire', 'Dead battery', 'Vehicle Diagnostics'] 
  },
  { 
    id: 'ax-lugogo', 
    name: 'Auto Xpress - Lugogo', 
    phone: '(256) 772-234567', 
    etaMinutes: 20, 
    currentLocation: { lat: 0.3270, lng: 32.5990 }, 
    generalLocation: "Lugogo (U-Save, Next to Forest Mall)",
    servicesOffered: ['Suspension Work', 'Diagnostics', 'Tire Alignment', 'Jump Start', 'Engine failure', 'Car Wash'] 
  },
  { 
    id: 'ax-ntinda', 
    name: 'Auto Xpress - Ntinda', 
    phone: '(256) 772-345678', 
    etaMinutes: 25, 
    currentLocation: { lat: 0.3450, lng: 32.6120 }, 
    generalLocation: "Ntinda (Strecher Road)",
    servicesOffered: ['Fuel Delivery (Emergency)', 'Battery Testing', 'Tire Puncture Repair', 'Minor Mechanical Repairs', 'Lockout', 'Fuel delivery'] 
  },
  { 
    id: 'ax-acacia', 
    name: 'Auto Xpress - Acacia Mall', 
    phone: '(256) 772-456789', 
    etaMinutes: 18, 
    currentLocation: { lat: 0.3312, lng: 32.5900 }, 
    generalLocation: "Kololo (Acacia Mall)",
    servicesOffered: ['Tire Sales & Fitting', 'Oil and Filter Change', 'Wiper Blade Replacement', 'Lockout Assistance (Limited)', 'Car Accessories'] 
  },
  { 
    id: 'ax-nakawa', 
    name: 'Auto Xpress - Nakawa', 
    phone: '(256) 772-678901', 
    etaMinutes: 22, 
    currentLocation: { lat: 0.3300, lng: 32.6150 }, 
    generalLocation: "Nakawa (Shell Select)",
    servicesOffered: ['Full Service Maintenance', 'Tire Balancing', 'Air Conditioning Recharge', 'Diagnostics', 'Engine failure', 'Wheel Alignment'] 
  },
  {
    id: 'ax-garden-city',
    name: 'Auto Xpress - Garden City',
    phone: '(256) 772-000111',
    etaMinutes: 12,
    currentLocation: { lat: 0.3178, lng: 32.5860 }, 
    generalLocation: "Kampala Central (Garden City Mall)",
    servicesOffered: ['Tire Services', 'Battery Check & Replacement', 'Oil Top-up', 'Wiper Blades']
  },
  {
    id: 'ax-village-mall',
    name: 'Auto Xpress - Village Mall',
    phone: '(256) 773-222333',
    etaMinutes: 28,
    currentLocation: { lat: 0.3500, lng: 32.6090 }, 
    generalLocation: "Bugolobi (Village Mall)",
    servicesOffered: ['Tire Sales', 'Battery Sales', 'Oil Change Services', 'Car Accessories']
  },
  {
    id: 'ax-metroplex-nalya',
    name: 'Auto Xpress - Metroplex Naalya',
    phone: '(256) 774-555666',
    etaMinutes: 35,
    currentLocation: { lat: 0.3670, lng: 32.6330 }, 
    generalLocation: "Naalya (Metroplex Mall)",
    servicesOffered: ['Tire Fitting & Balancing', 'Battery Services', 'Oil Change', 'Car Care Products']
  },
  // Entebbe Area
  { 
    id: 'ax-entebbe-victoria-mall', 
    name: 'Auto Xpress - Victoria Mall Entebbe', 
    phone: '(256) 772-567890', 
    etaMinutes: 45, 
    currentLocation: { lat: 0.0530, lng: 32.4640 }, 
    generalLocation: "Entebbe (Victoria Mall)",
    servicesOffered: ['Battery Jump Start', 'Tire Inflation & Repair', 'Fluid Top-up', 'Brake Pad Replacement', 'Flat tire', 'Oil Change'] 
  },
  { 
    id: 'ax-entebbe-shell', 
    name: 'Auto Xpress - Shell Entebbe Rd', 
    phone: '(256) 775-101010', 
    etaMinutes: 40, 
    currentLocation: { lat: 0.0650, lng: 32.4750 }, 
    generalLocation: "Entebbe Road (Shell)",
    servicesOffered: ['Tire Services', 'Battery Replacement', 'Oil Change', 'Quick Diagnostics'] 
  },
  // Mukono Area
   { 
    id: 'ax-mukono-sombe', 
    name: 'Auto Xpress - Mukono Sombe', 
    phone: '(256) 773-112233', 
    etaMinutes: 55, 
    currentLocation: { lat: 0.3550, lng: 32.7500 }, 
    generalLocation: "Mukono Town (Sombe Supermarket)",
    servicesOffered: ['Tire Services', 'Battery Replacement', 'Minor Mechanical Repairs', 'Jump Start', 'Oil Change'] 
  },
  // Jinja Area
  { 
    id: 'ax-jinja-main-street', 
    name: 'Auto Xpress - Jinja Main Street', 
    phone: '(256) 774-445566', 
    etaMinutes: 90, 
    currentLocation: { lat: 0.4320, lng: 33.2030 }, 
    generalLocation: "Jinja City (Main Street)",
    servicesOffered: ['Full Service Maintenance', 'Diagnostics', 'Tire Alignment', 'Brake Services', 'Suspension Checks'] 
  },
  // Mbarara Area
  {
    id: 'ax-mbarara-high-street',
    name: 'Auto Xpress - Mbarara High Street',
    phone: '(256) 776-777888',
    etaMinutes: 180, 
    currentLocation: { lat: -0.6070, lng: 30.6570 },
    generalLocation: "Mbarara (High Street)",
    servicesOffered: ['Tire Services', 'Battery Solutions', 'Oil Change', 'Basic Maintenance']
  }
];

export const getRequestsFromStorage = (): ServiceRequest[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const storedRequests = localStorage.getItem(LOCAL_STORAGE_REQUESTS_KEY);
    if (storedRequests) {
      return JSON.parse(storedRequests).map((req: any) => ({
        ...req,
        requestTime: new Date(req.requestTime), 
        vehicleInfo: req.vehicleInfo || { make: 'Unknown', model: 'Unknown', year: 'N/A', licensePlate: 'N/A' },
        selectedProvider: req.selectedProvider || { id: 'unknown', name: 'Unknown Provider', phone: 'N/A', etaMinutes: 0, currentLocation: {lat:0,lng:0}, generalLocation: 'Unknown', servicesOffered:[]},
      }));
    }
    return [];
  } catch (error) {
    console.error("Error reading requests from localStorage:", error);
    return [];
  }
};

export const saveRequestsToStorage = (requests: ServiceRequest[]): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const serializableRequests = requests.map(req => ({
      ...req,
      requestTime: req.requestTime.toISOString(),
    }));
    localStorage.setItem(LOCAL_STORAGE_REQUESTS_KEY, JSON.stringify(serializableRequests));
  } catch (error) {
    console.error("Error saving requests to localStorage:", error);
  }
};


export const getStaffMembersFromStorage = (): StaffMember[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const storedStaff = localStorage.getItem(LOCAL_STORAGE_STAFF_KEY);
    return storedStaff ? JSON.parse(storedStaff) : [];
  } catch (error) {
    console.error("Error reading staff members from localStorage:", error);
    return [];
  }
};

export const saveStaffMembersToStorage = (staffMembers: StaffMember[]): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(LOCAL_STORAGE_STAFF_KEY, JSON.stringify(staffMembers));
  } catch (error) {
    console.error("Error saving staff members to localStorage:", error);
  }
};

export const getGaragesFromStorage = (): ServiceProvider[] => {
  if (typeof window === 'undefined') {
    return [...INITIAL_MOCK_PROVIDERS]; // Return default if on server or no window
  }
  try {
    const storedGarages = localStorage.getItem(LOCAL_STORAGE_GARAGES_KEY);
    if (storedGarages) {
      const parsedGarages = JSON.parse(storedGarages);
      // Ensure servicesOffered is always an array
      return parsedGarages.map((g: ServiceProvider) => ({
        ...g,
        servicesOffered: Array.isArray(g.servicesOffered) ? g.servicesOffered : (typeof g.servicesOffered === 'string' ? g.servicesOffered.split(',').map(s=>s.trim()).filter(s=>s) : [])
      }));
    }
    // If no garages in storage, initialize with mock data and save it
    saveGaragesToStorage(INITIAL_MOCK_PROVIDERS);
    return [...INITIAL_MOCK_PROVIDERS];
  } catch (error) {
    console.error("Error reading garages from localStorage:", error);
    // Fallback to initial mock data in case of parsing error
    return [...INITIAL_MOCK_PROVIDERS];
  }
};

export const saveGaragesToStorage = (garages: ServiceProvider[]): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(LOCAL_STORAGE_GARAGES_KEY, JSON.stringify(garages));
  } catch (error) {
    console.error("Error saving garages to localStorage:", error);
  }
};
