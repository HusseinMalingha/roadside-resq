// This file is generated by Firebase Studio.
"use client";

import type { FC } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Clock, UserCircle, MapPin as LocationIcon, ShieldCheck, Pin } from 'lucide-react';
import type { ServiceProvider } from '@/types';
import { Badge } from '@/components/ui/badge';

interface ProviderCardProps {
  provider: ServiceProvider;
  onSelectProvider: (provider: ServiceProvider) => void;
}

const ProviderCard: FC<ProviderCardProps> = ({ provider, onSelectProvider }) => {
  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center">
            <UserCircle className="mr-3 h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <CardTitle className="text-lg md:text-xl font-semibold">{provider.name}</CardTitle>
              <CardDescription className="text-xs md:text-sm flex items-center text-muted-foreground">
                <LocationIcon className="mr-1 h-3.5 w-3.5" /> {provider.generalLocation}
              </CardDescription>
            </div>
          </div>
          {provider.distanceKm !== undefined && (
            <Badge variant="secondary" className="flex-shrink-0 text-xs">
              <Pin className="mr-1 h-3 w-3" /> 
              {provider.distanceKm.toFixed(1)} km
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 text-sm pb-4">
         <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span>Est. Arrival: <strong>{provider.etaMinutes} minutes</strong></span>
        </div>
        <div className="flex items-center">
          <Phone className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span>Contact: {provider.phone}</span>
        </div>
        <div className="pt-1">
            <p className="text-xs font-medium text-muted-foreground">Services include:</p>
            <p className="text-xs">
                {provider.servicesOffered.slice(0, 3).join(', ')} 
                {provider.servicesOffered.length > 3 ? ` & ${provider.servicesOffered.length - 3} more` : ''}
            </p>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4">
        <Button 
          onClick={() => onSelectProvider(provider)} 
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3 text-base"
          size="lg"
        >
          <ShieldCheck className="mr-2 h-5 w-5" />
          Request This Provider
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProviderCard;
