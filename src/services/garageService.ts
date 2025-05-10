
import type { ServiceProvider, Location } from '@/types';

const LOCAL_STORAGE_GARAGES_KEY = 'resqGarages';

const INITIAL_MOCK_PROVIDERS: ServiceProvider[] = [
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
    id: 'ax-entebbe',
    name: 'Auto Xpress - Entebbe',
    phone: '(256) 772-345678',
    etaMinutes: 45,
    currentLocation: { lat: 0.0476, lng: 32.4606 },
    generalLocation: "Entebbe Town (Shell Petrol Station)",
    servicesOffered: ['Tire Services', 'Battery Check', 'Oil Top-up', 'Flat tire']
  },
  {
    id: 'ax-mukono',
    name: 'Auto Xpress - Mukono',
    phone: '(256) 772-456789',
    etaMinutes: 60,
    currentLocation: { lat: 0.3550, lng: 32.7500 },
    generalLocation: "Mukono (Near Total Petrol Station)",
    servicesOffered: ['General Repair', 'Tire Puncture', 'Jump Start', 'Engine failure']
  },
  {
    id: 'ax-jinja',
    name: 'Auto Xpress - Jinja',
    phone: '(256) 772-567890',
    etaMinutes: 90,
    currentLocation: { lat: 0.4322, lng: 33.2040 },
    generalLocation: "Jinja Town (Main Street)",
    servicesOffered: ['Full Service', 'Tire Replacement', 'Battery Replacement', 'Vehicle Diagnostics']
  },
  {
    id: 'ax-mbarara',
    name: 'Auto Xpress - Mbarara',
    phone: '(256) 772-678901',
    etaMinutes: 180,
    currentLocation: { lat: -0.6070, lng: 30.6500 },
    generalLocation: "Mbarara Town (High Street)",
    servicesOffered: ['Major Repairs', 'Tire Services', 'Oil Change', 'Dead battery']
  }
];

const getAllLocalGarages = (): ServiceProvider[] => {
  if (typeof window === 'undefined') return [...INITIAL_MOCK_PROVIDERS];
  const garagesJson = localStorage.getItem(LOCAL_STORAGE_GARAGES_KEY);
  if (garagesJson) {
    return JSON.parse(garagesJson);
  }
  // If nothing in local storage, seed with initial mock providers
  localStorage.setItem(LOCAL_STORAGE_GARAGES_KEY, JSON.stringify(INITIAL_MOCK_PROVIDERS));
  return [...INITIAL_MOCK_PROVIDERS];
};

const saveAllLocalGarages = (garages: ServiceProvider[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_GARAGES_KEY, JSON.stringify(garages));
};

export const getAllGarages = async (): Promise<ServiceProvider[]> => {
  return Promise.resolve(getAllLocalGarages());
};

export const addGarage = async (garageData: Omit<ServiceProvider, 'id' | 'distanceKm'>): Promise<ServiceProvider> => {
  const allGarages = getAllLocalGarages();
  const newGarage: ServiceProvider = {
    ...garageData,
    id: `local-garage-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  };
  allGarages.push(newGarage);
  saveAllLocalGarages(allGarages);
  return Promise.resolve(newGarage);
};

export const updateGarage = async (garageId: string, garageData: Partial<Omit<ServiceProvider, 'id' | 'distanceKm'>>): Promise<void> => {
  let allGarages = getAllLocalGarages();
  const garageIndex = allGarages.findIndex(g => g.id === garageId);
  if (garageIndex !== -1) {
    allGarages[garageIndex] = { ...allGarages[garageIndex], ...garageData, id: garageId };
    saveAllLocalGarages(allGarages);
  } else {
    console.warn(`Garage with ID ${garageId} not found in localStorage for update.`);
  }
  return Promise.resolve();
};

export const deleteGarage = async (garageId: string): Promise<void> => {
  let allGarages = getAllLocalGarages();
  allGarages = allGarages.filter(g => g.id !== garageId);
  saveAllLocalGarages(allGarages);
  return Promise.resolve();
};

export const listenToGarages = (callback: (garages: ServiceProvider[]) => void): (() => void) => {
  const currentGarages = getAllLocalGarages();
  callback(currentGarages);

  const storageListener = (event: StorageEvent) => {
    if (event.key === LOCAL_STORAGE_GARAGES_KEY) {
      callback(getAllLocalGarages());
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', storageListener);
  }
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', storageListener);
    }
  };
};
