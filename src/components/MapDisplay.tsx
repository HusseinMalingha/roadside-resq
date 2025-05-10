"use client";

import Image from 'next/image';
import type { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, CarIcon } from 'lucide-react'; // Assuming CarIcon is for provider
import type { Location } from '@/types';

interface MapDisplayProps {
  userLocation?: Location | null;
  providerLocation?: Location | null;
  title?: string;
  height?: string; // e.g., 'h-64' or 'h-[300px]'
}

const MapDisplay: FC<MapDisplayProps> = ({ userLocation, providerLocation, title = "Live Map View", height = "h-80" }) => {
  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <MapPin className="mr-2 h-5 w-5 text-primary" /> 
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`relative w-full rounded-lg overflow-hidden bg-secondary/20 ${height}`}>
          <Image
            src="https://picsum.photos/seed/mapview/1200/600"
            alt="Map placeholder showing a cityscape or road"
            layout="fill"
            objectFit="cover"
            className="opacity-70"
            data-ai-hint="map city road"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-start justify-end bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 text-background space-y-1">
            {userLocation && (
              <div className="flex items-center bg-primary/80 backdrop-blur-sm text-primary-foreground px-3 py-1 rounded-full text-xs shadow-lg">
                <MapPin className="mr-1.5 h-3.5 w-3.5" />
                Your Location: {userLocation.lat.toFixed(3)}, {userLocation.lng.toFixed(3)}
              </div>
            )}
            {providerLocation && (
              <div className="flex items-center bg-accent/80 backdrop-blur-sm text-accent-foreground px-3 py-1 rounded-full text-xs shadow-lg">
                <CarIcon className="mr-1.5 h-3.5 w-3.5" />
                Provider: {providerLocation.lat.toFixed(3)}, {providerLocation.lng.toFixed(3)}
              </div>
            )}
            {!userLocation && !providerLocation && (
              <p className="text-sm font-medium bg-black/50 px-3 py-1 rounded">Waiting for location data...</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapDisplay;
