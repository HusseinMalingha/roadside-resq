
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Location, ServiceProvider, ServiceRequest as ServiceRequestType, VehicleInfo, DraftServiceRequestData } from '@/types';
import LocationRequester from '@/components/LocationRequester';
import IssueForm from '@/components/IssueForm';
import ProviderList from '@/components/ProviderList';
import MapDisplay from '@/components/MapDisplay';
import VehicleInfoForm from '@/components/VehicleInfoForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, MessageSquareHeart, Car, Clock, Loader2, ArrowLeft, Home, RefreshCw, LogIn, AlertCircle as AlertCircleIcon, Send, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addServiceRequest, listenToRequestById } from '@/services/requestService'; 
import { getDraftRequest, saveDraftRequest, deleteDraftRequest } from '@/services/draftRequestService'; 
import { getAllGarages } from '@/services/garageService'; // To fetch providers

type AppStep = 'initial' | 'details' | 'providers' | 'tracking' | 'completed';

export default function RoadsideRescuePage() {
  const { user, role, loading: authLoading, isFirebaseReady } = useAuth();
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
  const [serviceRequestId, setServiceRequestId] = useState<string | null>(null); 

  const [isLocationConfirmed, setIsLocationConfirmed] = useState(false);
  const [isIssueConfirmed, setIsIssueConfirmed] = useState(false);
  const [isVehicleInfoConfirmed, setIsVehicleInfoConfirmed] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [availableProviders, setAvailableProviders] = useState<ServiceProvider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);


  const { toast } = useToast();

  // Fetch providers when app initializes or firebase becomes ready
  useEffect(() => {
    const fetchProviders = async () => {
      if (isFirebaseReady) {
        setIsLoadingProviders(true);
        try {
          const providers = await getAllGarages();
          setAvailableProviders(providers);
        } catch (error) {
          console.error("Failed to fetch service providers:", error);
          toast({ title: "Error", description: "Could not load service providers.", variant: "destructive" });
        } finally {
          setIsLoadingProviders(false);
        }
      }
    };
    fetchProviders();
  }, [isFirebaseReady, toast]);

  const persistDraft = useCallback(async () => {
    if (user && currentStep === 'details' && isFirebaseReady) { 
      const draftData: Partial<Omit<DraftServiceRequestData, 'userId' | 'lastUpdated'>> = {
        userLocation: userLocation,
        issueDescription: issueDescription,
        issueSummary: confirmedIssueSummary,
        vehicleInfo: vehicleInfo,
      };
      try {
        await saveDraftRequest(user.uid, draftData);
      } catch (error) {
        console.warn("Failed to save draft to Firestore:", error);
      }
    }
  }, [user, userLocation, issueDescription, confirmedIssueSummary, vehicleInfo, currentStep, isFirebaseReady]);

  useEffect(() => {
    if (user && currentStep === 'details' && !isLoadingDraft && isFirebaseReady) {
      persistDraft();
    }
  }, [userLocation, issueDescription, confirmedIssueSummary, vehicleInfo, user, currentStep, persistDraft, isLoadingDraft, isFirebaseReady]);

  useEffect(() => {
    const loadDraft = async () => {
      if (user && currentStep === 'details' && isFirebaseReady) {
        setIsLoadingDraft(true);
        try {
          const draft = await getDraftRequest(user.uid);
          if (draft) {
            if (draft.userLocation) {
              setUserLocation(draft.userLocation);
              setIsLocationConfirmed(true);
            }
            if (draft.issueDescription) setIssueDescription(draft.issueDescription);
            if (draft.issueSummary) {
              setConfirmedIssueSummary(draft.issueSummary);
              if(draft.issueDescription) setIsIssueConfirmed(true); 
            }
            if (draft.vehicleInfo) {
              setVehicleInfo(draft.vehicleInfo);
              setIsVehicleInfoConfirmed(true);
            }
            toast({ title: "Draft Loaded", description: "Your previous in-progress request has been loaded.", duration: 3000});
          }
        } catch (error) {
          console.error("Error loading draft from Firestore:", error);
          toast({ title: "Draft Load Failed", description: "Could not load your saved draft.", variant: "destructive"});
        } finally {
          setIsLoadingDraft(false);
        }
      } else if (!isFirebaseReady && currentStep === 'details') {
         setIsLoadingDraft(false); // Not ready, don't attempt load
      } else {
        setIsLoadingDraft(false);
      }
    };
    
    if (currentStep === 'details') { 
        loadDraft();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentStep, isFirebaseReady]); 

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

  const handleSelectProvider = async (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setProviderETA(provider.etaMinutes); 
    setProviderCurrentLocation(provider.currentLocation);
    setHasProviderArrivedSimulation(false); 
    
    if (userLocation && user && vehicleInfo && isFirebaseReady) { 
      const newRequestData: Omit<ServiceRequestType, 'id' | 'requestTime'> & { requestTime: Date } = {
        requestId: `RR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        userId: user.uid, 
        userLocation: userLocation,
        issueDescription: issueDescription,
        issueSummary: confirmedIssueSummary,
        vehicleInfo: vehicleInfo, 
        selectedProvider: provider, // Embed provider details
        selectedProviderId: provider.id, // Store provider ID
        requestTime: new Date(), 
        status: 'Pending', 
        userName: user.displayName || user.email || "N/A",
        userPhone: user.phoneNumber || "N/A"
      };
      
      try {
        const createdRequest = await addServiceRequest(newRequestData); 
        setServiceRequest({ ...createdRequest, requestTime: new Date(createdRequest.requestTime as Date) }); 
        setServiceRequestId(createdRequest.id); 
        if (user) await deleteDraftRequest(user.uid); 
        setCurrentStep('tracking');
        toast({
          title: "Provider Selected!",
          description: `You've selected ${provider.name}. They are on their way. Request ID: ${createdRequest.requestId}`,
        });
      } catch (error) {
        console.error("Error creating service request:", error);
        toast({
          title: "Request Failed",
          description: "Could not submit your service request. Please try again.",
          variant: "destructive",
        });
      }
    } else {
       toast({
        title: "Missing Information or Service Unavailable",
        description: "Cannot create request. User, location, vehicle info is missing, or service is not ready.",
        variant: "destructive",
      });
    }
  };

  const resetApp = async () => {
    if (user && isFirebaseReady) {
        await deleteDraftRequest(user.uid).catch(err => console.warn("Failed to clear draft on reset", err));
    }
    setCurrentStep('initial');
    setUserLocation(null);
    setIssueDescription('');
    setConfirmedIssueSummary('');
    setVehicleInfo(null); 
    setSelectedProvider(null);
    setProviderETA(null);
    setProviderCurrentLocation(null);
    setServiceRequest(null);
    setServiceRequestId(null); 
    setIsLocationConfirmed(false);
    setIsIssueConfirmed(false);
    setIsVehicleInfoConfirmed(false);
    setHasProviderArrivedSimulation(false);
  };
  
  const handleInitialAction = () => {
    if (!isFirebaseReady) { 
      toast({
        title: "Service Unavailable",
        description: "Services are not ready. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    if (!user && !authLoading) {
      router.push('/login?redirect=/'); 
    } else if (user) {
      if (role === 'admin' || role === 'mechanic' || role === 'customer_relations') {
        toast({
          title: "Staff Account",
          description: "Staff members cannot make service requests. Redirecting to Garage Management.",
          variant: "default",
        });
        router.push('/garage-admin');
        return;
      }
      setCurrentStep('details');
    }
  };


  useEffect(() => {
    if (!serviceRequestId || currentStep !== 'tracking' || !isFirebaseReady) {
      return; 
    }

    const unsubscribe = listenToRequestById(serviceRequestId, (updatedRequest) => {
      if (updatedRequest) {
        const newServiceRequest = { ...updatedRequest, requestTime: new Date(updatedRequest.requestTime as Date) };
        if (serviceRequest?.status !== newServiceRequest.status) {
           toast({
            title: "Request Status Updated",
            description: `Your request status is now: ${newServiceRequest.status}`,
          });
        }
        setServiceRequest(newServiceRequest);
        
        if (newServiceRequest.selectedProvider) {
            setSelectedProvider(newServiceRequest.selectedProvider);
            setProviderETA(newServiceRequest.selectedProvider.etaMinutes); 
            setProviderCurrentLocation(newServiceRequest.selectedProvider.currentLocation); 
        }

        if (newServiceRequest.status === 'Completed' || newServiceRequest.status === 'Cancelled') {
          setCurrentStep('completed');
        }
      } else {
        console.warn(`Request with ID ${serviceRequestId} not found.`);
      }
    });

    return () => unsubscribe(); 
  }, [serviceRequestId, toast, currentStep, serviceRequest?.status, isFirebaseReady]);

  useEffect(() => {
    let trackingInterval: NodeJS.Timeout | null = null;

    if (currentStep === 'tracking' && selectedProvider && userLocation && providerETA !== null && serviceRequest && (serviceRequest.status === 'Accepted' || serviceRequest.status === 'In Progress')) {
      let currentSimulatedProviderLoc = providerCurrentLocation || selectedProvider.currentLocation; 
      const initialProviderLat = selectedProvider.currentLocation.lat;
      const initialProviderLng = selectedProvider.currentLocation.lng;
      const userLat = userLocation.lat;
      const userLng = userLocation.lng;
      
      const simulationDurationSeconds = Math.min(providerETA * 60, 120); 
      const updateIntervalMs = 2000;
      let elapsedSimulationTimeMs = 0;

      trackingInterval = setInterval(() => {
        elapsedSimulationTimeMs += updateIntervalMs;
        const progressRatio = Math.min(elapsedSimulationTimeMs / (simulationDurationSeconds * 1000), 1);

        if (userLocation && currentSimulatedProviderLoc && selectedProvider) {
            currentSimulatedProviderLoc = {
              lat: initialProviderLat + (userLat - initialProviderLat) * progressRatio,
              lng: initialProviderLng + (userLng - initialProviderLng) * progressRatio,
            };
            setProviderCurrentLocation(currentSimulatedProviderLoc);
        }

        if (progressRatio >= 1 && !hasProviderArrivedSimulation) {
          setHasProviderArrivedSimulation(true); 
          if (selectedProvider) { 
            toast({
              title: "Provider should be Arriving!",
              description: `${selectedProvider.name} is expected at your location. Actual status: ${serviceRequest.status}.`,
              duration: 7000,
            });
          }
        }
      }, updateIntervalMs);
    }
    return () => {
      if (trackingInterval) clearInterval(trackingInterval);
    };
  }, [currentStep, selectedProvider, userLocation, providerETA, toast, serviceRequest, hasProviderArrivedSimulation, providerCurrentLocation]); 


  const allDetailsProvided = isLocationConfirmed && isIssueConfirmed && isVehicleInfoConfirmed;
  const isStaffUser = user && (role === 'admin' || role === 'mechanic' || role === 'customer_relations');

  const renderStepContent = () => {
    if ((authLoading || isLoadingProviders) && currentStep === 'initial') {
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
                {isStaffUser 
                  ? "Welcome, Staff. Access the Garage Management portal." 
                  : "Don't worry, help is just a few taps away. Let's get you back on the road with ResQ."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6">
                {isStaffUser 
                  ? "Manage service requests, staff, and garage branches from the admin panel." 
                  : "We'll quickly find nearby assistance for your issue."
                }
              </p>
               {!isFirebaseReady && !authLoading && ( 
                <Alert variant="destructive" className="mb-4">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>Services Unavailable</AlertTitle>
                  <AlertDescription>
                    Cannot proceed. Please try again later.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              {isStaffUser ? (
                <Button asChild size="lg" className="w-full text-lg py-7 bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link href="/garage-admin">
                    <Settings className="mr-2 h-5 w-5" /> Go to Admin Portal
                  </Link>
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="w-full text-lg py-7 bg-accent hover:bg-accent/90 text-accent-foreground" 
                  onClick={handleInitialAction}
                  disabled={authLoading || !isFirebaseReady || isLoadingProviders} 
                >
                  {authLoading || isLoadingProviders ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 
                    !user ? <><LogIn className="mr-2 h-5 w-5" /> Login to Request</> : 
                    "Request Assistance Now"
                  }
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      case 'details':
        if (!user && isFirebaseReady && !authLoading) { 
          router.push('/login?redirect=/');
          return <div className="flex-grow flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-3">Redirecting to login...</p></div>;
        }
        if (isStaffUser) {
            toast({ title: "Staff Account", description: "Staff cannot make requests. Redirecting.", variant: "default"});
            router.push('/garage-admin');
            resetApp(); 
            return <div className="flex-grow flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-3">Redirecting Staff...</p></div>;
        }
        if (!isFirebaseReady && !authLoading) { 
             return (
                <Alert variant="destructive" className="w-full max-w-md">
                    <AlertCircleIcon className="h-4 w-4" />
                    <AlertTitle>Services Unavailable</AlertTitle>
                    <AlertDescription>Cannot load details form as services are not ready.</AlertDescription>
                     <Button onClick={() => resetApp()} className="mt-4">Go Back</Button>
                </Alert>
            );
        }
        if (isLoadingDraft) {
            return (
                <div className="flex flex-col items-center justify-center flex-grow w-full py-8">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Loading your details...</p>
                </div>
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
                disabled={!allDetailsProvided || isLoadingProviders} 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-7" 
                size="lg"
              >
                {isLoadingProviders ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Send className="mr-2 h-5 w-5" />}
                {isLoadingProviders ? "Loading Providers..." : "Find Service Providers"}
              </Button>
              {!allDetailsProvided && (
                <p className="text-xs text-destructive text-center">
                  Please confirm location, issue, and vehicle details to proceed.
                </p>
              )}
               <Button variant="outline" onClick={() => resetApp()} className="w-full">
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
              staticProviders={availableProviders} // Pass fetched providers
              isLoading={isLoadingProviders}
            />
          </div>
        );
      case 'tracking':
        if (!selectedProvider || !serviceRequest) return <div className="text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-4" /><p>Loading request details...</p></div>;
        return (
          <div className="w-full max-w-2xl space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => setCurrentStep('providers')} className="mb-2 self-start" disabled={serviceRequest.status === 'Completed' || serviceRequest.status === 'Cancelled'}>
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
             <Button variant="outline" onClick={() => resetApp()} className="w-full mt-4">
                <Home className="mr-2 h-4 w-4" /> Start New Request
            </Button>
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
              <Button size="lg" className="w-full text-lg py-7" onClick={() => resetApp()}>
                <Home className="mr-2 h-5 w-5" /> Back to Home
              </Button>
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
