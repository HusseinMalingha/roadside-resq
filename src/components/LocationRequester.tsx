"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MapPin, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import type { Location } from '@/types';

interface LocationRequesterProps {
  onLocationAcquired: (location: Location) => void;
  userLocation: Location | null;
}

const LocationRequester: FC<LocationRequesterProps> = ({ onLocationAcquired, userLocation }) => {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    // Attempt to get location automatically on mount if not already acquired
    if (!userLocation && !hasAttempted && typeof window !== 'undefined' && navigator.geolocation) {
      handleGetLocation(true); // true for silent attempt
      setHasAttempted(true);
    }
  }, [userLocation, hasAttempted]);


  const handleGetLocation = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLoadingLocation(true);
    if (!silent) setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationAcquired({ lat: latitude, lng: longitude });
        setIsLoadingLocation(false);
      },
      (error) => {
        if (!silent || (silent && error.code === error.PERMISSION_DENIED)) {
          setLocationError(`Error: ${error.message}. Please ensure location services are enabled.`);
        }
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-3 w-full">
      <Button 
        onClick={() => handleGetLocation(false)} 
        disabled={isLoadingLocation} 
        className="w-full text-base py-6" 
        variant={userLocation ? "default" : "outline"}
        size="lg"
      >
        {isLoadingLocation && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {userLocation ? <CheckCircle2 className="mr-2 h-5 w-5 text-green-400" /> : <MapPin className="mr-2 h-5 w-5" />}
        {userLocation ? 'Location Acquired!' : (isLoadingLocation ? 'Fetching Location...' : 'Share My Current Location')}
      </Button>
      {locationError && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Location Error</AlertTitle>
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default LocationRequester;
