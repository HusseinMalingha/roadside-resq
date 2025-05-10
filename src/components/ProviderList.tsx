"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import ProviderCard from './ProviderCard';
import type { ServiceProvider, Location as UserLocationType } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SearchX, Loader2, ListFilter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProviderListProps {
  userLocation: UserLocationType | null;
  issueType: string;
  onSelectProvider: (provider: ServiceProvider) => void;
}

const MOCK_PROVIDERS: ServiceProvider[] = [
  { id: '1', name: 'QuickFix Auto Services', phone: '(555) 123-4567', etaMinutes: 15, currentLocation: { lat: 34.060, lng: -118.250 }, servicesOffered: ['Flat Tire', 'Jump Start', 'Battery Test'] },
  { id: '2', name: 'Reliable Roadside Towing', phone: '(555) 567-8901', etaMinutes: 25, currentLocation: { lat: 34.030, lng: -118.200 }, servicesOffered: ['Towing', 'Lockout Assistance', 'Winch Out'] },
  { id: '3', name: 'Roadside Heroes 24/7', phone: '(555) 876-5432', etaMinutes: 20, currentLocation: { lat: 34.080, lng: -118.300 }, servicesOffered: ['Fuel Delivery', 'Battery Replacement', 'Flat Tire Change'] },
  { id: '4', name: 'Speedy Gonzales Assistance', phone: '(555) 432-1098', etaMinutes: 30, currentLocation: { lat: 34.000, lng: -118.280 }, servicesOffered: ['Jump Start', 'Towing', 'Minor Mechanical Repairs'] },
  { id: '5', name: 'Metro Vehicle Rescue', phone: '(555) 222-3333', etaMinutes: 18, currentLocation: { lat: 34.055, lng: -118.265 }, servicesOffered: ['Lockout', 'Fuel Delivery', 'Tire Inflation'] },
  { id: '6', name: 'Highway Helpers Inc.', phone: '(555) 777-8888', etaMinutes: 22, currentLocation: { lat: 34.070, lng: -118.230 }, servicesOffered: ['Flat Tire', 'Towing', 'Battery Jump'] },
];

function calculateDistance(loc1: UserLocationType, loc2: UserLocationType): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const ProviderList: FC<ProviderListProps> = ({ userLocation, issueType, onSelectProvider }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      let filteredProviders = MOCK_PROVIDERS;
      if (issueType && issueType.trim() !== "") {
        const lowerIssueType = issueType.toLowerCase();
        filteredProviders = MOCK_PROVIDERS.filter(p => 
          p.servicesOffered.some(service => service.toLowerCase().includes(lowerIssueType)) ||
          p.servicesOffered.some(service => lowerIssueType.includes(service.toLowerCase())) 
        );
      }
      
      if (userLocation) {
        filteredProviders = filteredProviders.map(p => ({
          ...p,
          distanceKm: calculateDistance(userLocation, p.currentLocation)
        })).sort((a,b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
      } else {
         filteredProviders = filteredProviders.map(p => ({ ...p, distanceKm: undefined })).sort((a,b) => a.etaMinutes - b.etaMinutes); // Sort by ETA if no location
      }

      setProviders(filteredProviders);
      setIsLoading(false);
    }, 1500); // Simulate API call
  }, [userLocation, issueType]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-muted-foreground w-full min-h-[40vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Finding available providers for you...</p>
        <p className="text-sm">Please wait a moment.</p>
      </div>
    );
  }
  
  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center">
            <ListFilter className="mr-2 h-6 w-6 text-primary"/>
            Nearby Service Providers
        </CardTitle>
        <p className="text-muted-foreground">
            Showing providers {issueType ? `for "${issueType}"` : ''} {userLocation ? 'sorted by distance.' : 'sorted by ETA.'}
        </p>
      </CardHeader>
      <CardContent>
        {providers.length === 0 ? (
            <Alert variant="default" className="mt-4">
              <SearchX className="h-5 w-5" />
              <AlertTitle className="font-semibold">No Providers Found</AlertTitle>
              <AlertDescription>
                Unfortunately, we couldn't find any providers matching your current criteria for "{issueType || 'your issue'}" 
                {userLocation ? ' near your location' : ''}. You might want to try adjusting the issue description or checking back later.
              </AlertDescription>
            </Alert>
        ) : (
          <ScrollArea className="h-[calc(100vh-380px)] min-h-[300px] pr-3">
            <div className="space-y-4">
              {providers.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} onSelectProvider={onSelectProvider} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default ProviderList;
