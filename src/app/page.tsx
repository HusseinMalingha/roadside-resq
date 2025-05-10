
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Location, ServiceProvider, ServiceRequest as ServiceRequestType, VehicleInfo } from '@/types';
import LocationRequester from '@/components/LocationRequester';
import IssueForm from '@/components/IssueForm';
import ProviderList from '@/components/ProviderList';
import MapDisplay from '@/components/MapDisplay';
import VehicleInfoForm from '@/components/VehicleInfoForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, MessageSquareHeart, Car, Clock, Loader2, ArrowLeft, Home, RefreshCw, LogIn, AlertCircle as AlertCircleIcon, Send } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getRequestsFromStorage, saveRequestsToStorage, LOCAL_STORAGE_REQUESTS_KEY } from '@/lib/localStorageUtils';

type AppStep = 'initial' | 'details' | 'providers' | 'tracking' | 'completed';

export default function RoadsideRescuePage() {
  const { user, loading: authLoading, isFirebaseReady } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<AppStep>('initial');
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [issueDescription, setIssueDescription] = useState<string>('');
  const [confirmedIssueSummary, setConfirmedIssueSummary] = useState<string>('');
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [providerETA, setProviderETA] = useState<number | null>(null);
  const [providerCurrentLocation, setProviderCurrentLocation] = useState<Location | null>(null);
  const [hasProviderArrivedSimulation, setHasProviderArrivedSimulation] = useState(false);
  
  const [serviceRequest, setServiceRequest] = useState<ServiceRequestType | null>(null);

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
    setHasProviderArrivedSimulation(false); 
    
    if (userLocation && user && vehicleInfo) { 
      const newRequest: ServiceRequestType = {
        id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // More unique ID
        requestId: `RR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        userId: user.uid, // Store the user's Firebase UID
        userLocation: userLocation,
        issueDescription: issueDescription,
        issueSummary: confirmedIssueSummary,
        vehicleInfo: vehicleInfo, 
        selectedProvider: provider,
        requestTime: new Date(),
        status: 'Pending', 
        userName: user.displayName || user.email || "N/A",
        userPhone: user.phoneNumber || "N/A"
      };
      setServiceRequest(newRequest);
      
      const currentRequests = getRequestsFromStorage();
      saveRequestsToStorage([...currentRequests, newRequest]);
      
      console.log("Service Request Created and Saved to localStorage:", newRequest); 
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
    setVehicleInfo(null); 
    setSelectedProvider(null);
    setProviderETA(null);
    setProviderCurrentLocation(null);
    setServiceRequest(null);
    setIsLocationConfirmed(false);
    setIsIssueConfirmed(false);
    setIsVehicleInfoConfirmed(false);
    setHasProviderArrivedSimulation(false);
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
    let statusPollInterval: NodeJS.Timeout;

    if (currentStep === 'tracking' && selectedProvider && userLocation && providerETA !== null && serviceRequest) {
      let simulatedTravelTimeRemaining = providerETA; 
      let currentSimulatedProviderLoc = providerCurrentLocation || selectedProvider.currentLocation; 

      trackingInterval = setInterval(() => {
        if (simulatedTravelTimeRemaining > 0) {
          simulatedTravelTimeRemaining -= 1; 
        }

        if (userLocation && currentSimulatedProviderLoc && selectedProvider) {
            const totalSteps = providerETA > 0 ? providerETA : 1; 
            const stepsProgressRatio = Math.min((providerETA - simulatedTravelTimeRemaining) / totalSteps, 1);

            const initialProviderLat = selectedProvider.currentLocation.lat;
            const initialProviderLng = selectedProvider.currentLocation.lng;
            const userLat = userLocation.lat;
            const userLng = userLocation.lng;
            
            currentSimulatedProviderLoc = {
              lat: initialProviderLat + (userLat - initialProviderLat) * stepsProgressRatio,
              lng: initialProviderLng + (userLng - initialProviderLng) * stepsProgressRatio,
            };
            setProviderCurrentLocation(currentSimulatedProviderLoc);
        }

        if (simulatedTravelTimeRemaining <= 0 && !hasProviderArrivedSimulation) {
          // No longer clearing interval here immediately, wait for status update to 'Completed' or manual step change
          setHasProviderArrivedSimulation(true); 
          // Don't automatically go to 'completed', wait for status update from garage or if garage sets to completed
          if (selectedProvider) { 
            toast({
              title: "Provider should be Arriving!",
              description: `${selectedProvider.name} is expected at your location. Check request status.`,
              duration: 7000,
            });
          }
        }
      }, 2000);

      // Poll for status updates
      statusPollInterval = setInterval(() => {
        const allRequests = getRequestsFromStorage();
        const updatedRequest = allRequests.find(req => req.id === serviceRequest.id);
        if (updatedRequest && updatedRequest.status !== serviceRequest.status) {
          toast({
            title: "Request Status Updated",
            description: `Your request status is now: ${updatedRequest.status}`,
          });
          setServiceRequest(updatedRequest); // Update local service request state
          if (updatedRequest.status === 'Completed' || updatedRequest.status === 'Cancelled') {
            setCurrentStep('completed');
            clearInterval(trackingInterval); // Stop simulation if completed/cancelled
            clearInterval(statusPollInterval); // Stop polling
          }
        }
      }, 5000); // Poll every 5 seconds
    }
    return () => {
      clearInterval(trackingInterval);
      clearInterval(statusPollInterval);
    };
  // providerCurrentLocation removed as it causes re-runs. ServiceRequest added for status polling.
  }, [currentStep, selectedProvider, userLocation, providerETA, toast, serviceRequest, hasProviderArrivedSimulation]); 


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
              <CardTitle className="text-3xl font-bold">Emergency?</CardTitle>
              <CardDescription className="text-lg text-muted-foreground">
                Don't worry, help is just a few taps away. Let's get you back on the road with ResQ.
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
          return <div className="flex-grow flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-3">Redirecting to login...</p></div>;
        }
        if (!isFirebaseReady && !authLoading) { // Check authLoading here too
             return (
                <Alert variant="destructive" className="w-full max-w-md">
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
                <p className="text-xs text-destructive text-center">
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
        if (!selectedProvider || !serviceRequest) return <div className="text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-4" /><p>Loading request details...</p></div>;
        return (
          <div className="w-full max-w-2xl space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => setCurrentStep('providers')} className="mb-2 self-start">
                <ArrowLeft className="mr-2 h-4 w-4" /> Change Provider
              </Button>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full text-white ${
                  serviceRequest.status === 'Pending' ? 'bg-yellow-500' :
                  serviceRequest.status === 'Accepted' ? 'bg-blue-500' :
                  serviceRequest.status === 'In Progress' ? 'bg-indigo-500' :
                  serviceRequest.status === 'Completed' ? 'bg-green-500' :
                  serviceRequest.status === 'Cancelled' ? 'bg-red-500' : 'bg-gray-500'
              }`}>
                Status: {serviceRequest.status}
              </span>
            </div>
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
                  {providerETA !== null && !hasProviderArrivedSimulation && serviceRequest.status !== 'Completed' && serviceRequest.status !== 'Cancelled' && (
                    <div className="flex items-center text-xl font-semibold text-primary">
                      <Clock className="mr-2 h-6 w-6" />
                      Original Est. Arrival: {providerETA} min
                    </div>
                  )}
                  {hasProviderArrivedSimulation && serviceRequest.status !== 'Completed' && serviceRequest.status !== 'Cancelled' && (
                     <div className="flex items-center text-xl font-semibold text-orange-500">
                      <Clock className="mr-2 h-6 w-6" />
                      Provider expected. Current status: {serviceRequest.status}
                    </div>
                  )}
                  {serviceRequest.status === 'Completed' && (
                     <div className="flex items-center text-xl font-semibold text-green-600">
                      <CheckCircle className="mr-2 h-6 w-6" />
                      Service Completed!
                    </div>
                  )}
                   {serviceRequest.status === 'Cancelled' && (
                     <div className="flex items-center text-xl font-semibold text-red-600">
                      <AlertCircleIcon className="mr-2 h-6 w-6" />
                      Service Cancelled
                    </div>
                  )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'completed':
         if (!serviceRequest) return <div className="text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-4" /><p>Loading service details...</p></div>;
        return (
          <Card className="w-full max-w-md text-center shadow-xl animate-fadeIn">
            <CardHeader>
               <div className={`mx-auto text-primary-foreground rounded-full p-4 w-fit mb-4 ${serviceRequest.status === 'Completed' ? 'bg-green-500' : 'bg-red-500'}`}>
                {serviceRequest.status === 'Completed' ? <MessageSquareHeart className="h-12 w-12" /> : <AlertCircleIcon className="h-12 w-12" />}
              </div>
              <CardTitle className="text-3xl font-bold">Service {serviceRequest.status} (ID: {serviceRequest.requestId})</CardTitle>
               {selectedProvider && <CardDescription className="text-lg text-muted-foreground">
                {serviceRequest.status === 'Completed' ? `${selectedProvider.name} has completed the service.` : `Your request with ${selectedProvider.name} was cancelled.`}
                </CardDescription>}
            </CardHeader>
            <CardContent>
              <p className="mb-6">
                {serviceRequest.status === 'Completed' ? "We hope you're back on your way safely!" : "We're sorry this request didn't work out."}
              </p>
              {serviceRequest.vehicleInfo && (
                  <p className="text-sm text-muted-foreground mb-3">
                    For your {serviceRequest.vehicleInfo.make} {serviceRequest.vehicleInfo.model}.
                  </p>
              )}
              <Alert variant={serviceRequest.status === 'Completed' ? "default" : "destructive"}>
                {serviceRequest.status === 'Completed' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircleIcon className="h-4 w-4"/> }
                <AlertTitle>{serviceRequest.status === 'Completed' ? "Confirmation" : "Notification"}</AlertTitle>
                <AlertDescription>
                  {serviceRequest.status === 'Completed' ? `Your request has been marked as completed.` : `Your request has been marked as cancelled.`}
                  {selectedProvider && ` If you have any questions, please contact ${selectedProvider.name} directly.`}
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button size="lg" className="w-full text-lg py-7" onClick={resetApp}>
                <Home className="mr-2 h-5 w-5" /> Back to Home
              </Button>
               {serviceRequest.status !== 'Completed' && serviceRequest.status !== 'Cancelled' && (
                 <Button size="sm" variant="outline" className="w-full" onClick={() => {setHasProviderArrivedSimulation(false); setCurrentStep('tracking');}}>
                  <RefreshCw className="mr-2 h-4 w-4" /> View Tracking Again
                </Button>
               )}
            </CardFooter>
          </Card>
        );
      default:
        return <p>An unexpected error occurred. Please refresh the page.</p>;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-grow w-full py-8 min-h-full">
      {renderStepContent()}
    </div>
  );
}
