
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Location, ServiceProvider, ServiceRequest as ServiceRequestType, VehicleInfo } from '@/types';
import LocationRequester from '@/components/LocationRequester';
import IssueForm from '@/components/IssueForm';
import ProviderList from '@/components/ProviderList';
import MapDisplay from '@/components/MapDisplay';
import VehicleInfoForm from '@/components/VehicleInfoForm'; // Import VehicleInfoForm
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, MessageSquareHeart, Car, Clock, Loader2, ArrowLeft, Home, RefreshCw, LogIn, AlertCircle as AlertCircleIcon, Send } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

type AppStep = 'initial' | 'details' | 'providers' | 'tracking' | 'completed';

export default function RoadsideRescuePage() {
  const { user, loading: authLoading, isFirebaseReady } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<AppStep>('initial');
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [confirmedIssueSummary, setConfirmedIssueSummary] = useState<string>('');
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null); // State for vehicle info
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [providerETA, setProviderETA] = useState<number | null>(null);
  const [providerCurrentLocation, setProviderCurrentLocation] = useState<Location | null>(null);
  
  const [serviceRequest, setServiceRequest] = useState<ServiceRequestType | null>(null);

  // Submission states for sub-forms
  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);
  const [isIssueConfirmed, setIsIssueConfirmed] = useState(false);
  const [isVehicleInfoConfirmed, setIsVehicleInfoConfirmed] = useState(false);

  const { toast } = useToast();

  const handleLocationAcquired = useCallback((location: Location) => {
    setUserLocation(location);
    setIsLocationConfirmed(true);
    toast({
      title: "Location Acquired!",
      description: `Your location is set: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
      variant: "default", 
    });
  }, [toast]);

  const handleIssueDetailsConfirmed = (description: string, summary: string) => {
    setIssueDescription(description);
    setConfirmedIssueSummary(summary);
    setIsIssueConfirmed(true);
    toast({
      title: "Issue Details Confirmed",
      description: `Issue: ${summary}`,
    });
  };

  const handleVehicleInfoSubmit = (info: VehicleInfo) => {
    setVehicleInfo(info);
    setIsVehicleInfoConfirmed(true);
    toast({
      title: "Vehicle Info Confirmed",
      description: `${info.make} ${info.model} (${info.licensePlate})`,
    });
  };

  const handleProceedToProviders = () => {
    if (isLocationConfirmed && isIssueConfirmed && isVehicleInfoConfirmed) {
      setCurrentStep('providers');
      toast({
        title: "Finding Providers",
        description: `Looking for help for: ${confirmedIssueSummary}`,
      });
    } else {
      toast({
        title: "Incomplete Details",
        description: "Please confirm location, issue, and vehicle details before proceeding.",
        variant: "destructive",
      });
    }
  };

  const handleSelectProvider = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setProviderETA(provider.etaMinutes);
    setProviderCurrentLocation(provider.currentLocation);
    
    if (userLocation && user && vehicleInfo) { // Ensure vehicleInfo is also present
      const newRequest: ServiceRequestType = {
        id: `req-${Date.now()}`, 
        requestId: `RR-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        userLocation: userLocation,
        issueDescription: issueDescription,
        issueSummary: confirmedIssueSummary,
        vehicleInfo: vehicleInfo, // Add vehicle info to the request
        selectedProvider: provider,
        requestTime: new Date(),
        status: 'Pending', 
        userName: user.displayName || "N/A",
        userPhone: user.phoneNumber || "N/A"
      };
      setServiceRequest(newRequest);
      console.log("Service Request Created:", newRequest); 
    }
    
    setCurrentStep('tracking');
     toast({
      title: "Provider Selected!",
      description: `You've selected ${provider.name}. They are on their way.`,
    });
  };

  const resetApp = () => {
    setCurrentStep('initial');
    setUserLocation(null);
    setIssueDescription('');
    setConfirmedIssueSummary('');
    setVehicleInfo(null); // Reset vehicle info
    setSelectedProvider(null);
    setProviderETA(null);
    setProviderCurrentLocation(null);
    setServiceRequest(null);
    setIsLocationConfirmed(false);
    setIsIssueConfirmed(false);
    setIsVehicleInfoConfirmed(false);
  };
  
  const handleInitialAction = () => {
    if (!isFirebaseReady) {
      toast({
        title: "Service Unavailable",
        description: "Authentication service is not ready. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    if (!user && !authLoading) {
      router.push('/login?redirect=/'); 
    } else if (user) {
      setCurrentStep('details');
    }
  };

  useEffect(() => {
    let trackingInterval: NodeJS.Timeout;
    if (currentStep === 'tracking' && selectedProvider && userLocation && providerETA !== null) {
      let currentEta = providerETA;
      let currentProviderLoc = providerCurrentLocation || selectedProvider.currentLocation;

      trackingInterval = setInterval(() => {
        currentEta -= 1;
        setProviderETA(currentEta);

        if (currentEta <= 0) {
          clearInterval(trackingInterval);
          setCurrentStep('completed');
          setProviderETA(0);
           toast({
            title: "Provider Arrived!",
            description: `${selectedProvider.name} should be at your location.`,
            duration: 7000,
          });
          return;
        }
        
        if (userLocation && currentProviderLoc) {
            const latDiff = userLocation.lat - currentProviderLoc.lat;
            const lngDiff = userLocation.lng - currentProviderLoc.lng;
            const stepsRemaining = currentEta > 0 ? currentEta : 1; 
            
            currentProviderLoc = {
            lat: currentProviderLoc.lat + latDiff / stepsRemaining,
            lng: currentProviderLoc.lng + lngDiff / stepsRemaining,
            };
            setProviderCurrentLocation(currentProviderLoc);
        }
      }, 2000); 
    }
    return () => clearInterval(trackingInterval);
  }, [currentStep, selectedProvider, userLocation, providerETA, providerCurrentLocation, toast]);

  const allDetailsProvided = isLocationConfirmed && isIssueConfirmed && isVehicleInfoConfirmed;

  const renderStepContent = () => {
    if (authLoading && currentStep === 'initial') {
      return (
        <div className="flex flex-col items-center justify-center flex-grow w-full py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      );
    }

    switch (currentStep) {
      case 'initial':
        return (
          <Card className="w-full max-w-md text-center shadow-xl animate-fadeIn">
            <CardHeader>
              <div className="mx-auto bg-primary text-primary-foreground rounded-full p-4 w-fit mb-4">
                <Car className="h-12 w-12" />
              </div>
              <CardTitle className="text-3xl font-bold">Roadside Emergency?</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Don't worry, help is just a few taps away. Let's get you back on the road.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6">We'll quickly find nearby assistance for your issue.</p>
               {!isFirebaseReady && !authLoading && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>Authentication Service Unavailable</AlertTitle>
                  <AlertDescription>
                    Cannot proceed with request. Please try again later.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                size="lg" 
                className="w-full text-lg py-7 bg-accent hover:bg-accent/90 text-accent-foreground" 
                onClick={handleInitialAction}
                disabled={authLoading || !isFirebaseReady}
              >
                {authLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 
                  !user ? <><LogIn className="mr-2 h-5 w-5" /> Login to Request</> : "Request Assistance Now"
                }
              </Button>
            </CardFooter>
          </Card>
        );
      case 'details':
        if (!user && isFirebaseReady) { 
          router.push('/login?redirect=/');
          return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
        }
        if (!isFirebaseReady) {
             return (
                <Alert variant="destructive">
                    <AlertCircleIcon className="h-4 w-4" />
                    <AlertTitle>Service Unavailable</AlertTitle>
                    <AlertDescription>Cannot load details form as authentication service is not ready.</AlertDescription>
                     <Button onClick={resetApp} className="mt-4">Go Back</Button>
                </Alert>
            );
        }
        return (
          <div className="w-full max-w-2xl space-y-8 animate-slideUp">
            <div className="text-center">
              <h1 className="text-3xl font-semibold mb-2">Request Assistance</h1>
              <p className="text-muted-foreground mb-6">Complete the steps below to find help.</p>
            </div>
            
            <LocationRequester onLocationAcquired={handleLocationAcquired} userLocation={userLocation} />
            
            {userLocation && (
              <div className="mt-4 animate-fadeIn">
                 <MapDisplay userLocation={userLocation} title="Your Current Location" />
              </div>
            )}
            
            <IssueForm
              onIssueDetailsConfirmed={handleIssueDetailsConfirmed}
              isLocationAvailable={!!userLocation}
              initialDescription={issueDescription}
              initialSummary={confirmedIssueSummary}
              isSubmitted={isIssueConfirmed}
            />

            <VehicleInfoForm 
              onVehicleInfoSubmit={handleVehicleInfoSubmit}
              initialData={vehicleInfo || {}}
              isSubmitted={isVehicleInfoConfirmed}
            />
            
            <div className="space-y-3 pt-4">
              <Button 
                onClick={handleProceedToProviders} 
                disabled={!allDetailsProvided} 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-7" 
                size="lg"
              >
                <Send className="mr-2 h-5 w-5" />
                Find Service Providers
              </Button>
              {!allDetailsProvided && (
                <p className="text-xs text-orange-600 text-center">
                  Please confirm location, issue, and vehicle details to proceed.
                </p>
              )}
               <Button variant="outline" onClick={resetApp} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" /> Start Over
              </Button>
            </div>

          </div>
        );
      case 'providers':
        return (
          <div className="w-full animate-slideUp flex flex-col flex-grow">
             <Button variant="outline" onClick={() => setCurrentStep('details')} className="mb-6 flex-shrink-0 self-start">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Details
            </Button>
            <ProviderList
              userLocation={userLocation}
              issueType={confirmedIssueSummary}
              onSelectProvider={handleSelectProvider}
            />
          </div>
        );
      case 'tracking':
        if (!selectedProvider || !serviceRequest) return <p>Error: No provider selected or request not created.</p>;
        return (
          <div className="w-full max-w-2xl space-y-6 animate-fadeIn">
            <Button variant="outline" onClick={() => setCurrentStep('providers')} className="mb-2 self-start">
              <ArrowLeft className="mr-2 h-4 w-4" /> Change Provider
            </Button>
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Tracking Your Assistance (ID: {serviceRequest.requestId})</CardTitle>
                <CardDescription>{selectedProvider.name} is on the way!</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <MapDisplay userLocation={userLocation} providerLocation={providerCurrentLocation} title="Provider En Route" />
                <div className="p-4 border rounded-lg bg-card">
                  <h3 className="text-lg font-semibold mb-1">{selectedProvider.name}</h3>
                  <p className="text-sm text-muted-foreground">Contact: {selectedProvider.phone}</p>
                   <p className="text-sm text-muted-foreground">Client: {serviceRequest.userName}</p>
                   <p className="text-sm text-muted-foreground">Contact: {serviceRequest.userPhone}</p>
                   {serviceRequest.vehicleInfo && (
                     <p className="text-sm text-muted-foreground">
                       Vehicle: {serviceRequest.vehicleInfo.make} {serviceRequest.vehicleInfo.model} ({serviceRequest.vehicleInfo.year}) - {serviceRequest.vehicleInfo.licensePlate}
                     </p>
                   )}
                  <div className="mt-3 pt-3 border-t">
                  {providerETA !== null && providerETA > 0 ? (
                    <div className="flex items-center text-xl font-semibold text-primary">
                      <Clock className="mr-2 h-6 w-6" />
                      Estimated Arrival: {providerETA} min
                    </div>
                  ) : providerETA === 0 ? (
                     <div className="flex items-center text-xl font-semibold text-green-600">
                      <CheckCircle className="mr-2 h-6 w-6" />
                      Provider should be arriving now!
                    </div>
                  ) : (
                    <div className="flex items-center text-lg text-muted-foreground">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Calculating arrival...
                    </div>
                  )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'completed':
         if (!serviceRequest) return <p>Error: Service details not found.</p>;
        return (
          <Card className="w-full max-w-md text-center shadow-xl animate-fadeIn">
            <CardHeader>
               <div className="mx-auto bg-green-500 text-primary-foreground rounded-full p-4 w-fit mb-4">
                <MessageSquareHeart className="h-12 w-12" />
              </div>
              <CardTitle className="text-3xl font-bold">Service Confirmed! (ID: {serviceRequest.requestId})</CardTitle>
               {selectedProvider && <CardDescription className="text-lg text-muted-foreground">{selectedProvider.name} has been notified and should be with you shortly, or has arrived.</CardDescription>}
            </CardHeader>
            <CardContent>
              <p className="mb-6">We hope you get back on your way safely and quickly!</p>
              {serviceRequest.vehicleInfo && (
                  <p className="text-sm text-muted-foreground mb-3">
                    For your {serviceRequest.vehicleInfo.make} {serviceRequest.vehicleInfo.model}.
                  </p>
              )}
              <Alert variant="default">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Confirmation</AlertTitle>
                <AlertDescription>
                  Your request has been processed. If you need further assistance, please contact {selectedProvider?.name || 'the provider'} directly.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button size="lg" className="w-full text-lg py-7" onClick={resetApp}>
                <Home className="mr-2 h-5 w-5" /> Back to Home
              </Button>
               <Button size="sm" variant="outline" className="w-full" onClick={() => setCurrentStep('tracking')}>
                <RefreshCw className="mr-2 h-4 w-4" /> View Tracking Again
              </Button>
            </CardFooter>
          </Card>
        );
      default:
        return <p>An unexpected error occurred. Please refresh the page.</p>;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-grow w-full py-8">
      {renderStepContent()}
    </div>
  );
}
