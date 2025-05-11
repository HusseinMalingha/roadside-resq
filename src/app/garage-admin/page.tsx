
// src/app/garage-admin/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ServiceRequest, ServiceProvider, VehicleInfo, StaffMember } from '@/types';
import RequestList from '@/components/garage/RequestList';
import StaffManagement from '@/components/garage/StaffManagement';
import GarageManagement from '@/components/garage/GarageManagement';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, RefreshCw, Loader2, ShieldAlert, Home, Bell, Users, WrenchIcon, Briefcase, Building, ClipboardList } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import AssignStaffDialog from '@/components/garage/AssignStaffDialog';
import { respondToCancellationRequest } from '@/services/requestService';

// Import Firestore based services
import { listenToRequests, updateServiceRequest, getAllRequests } from '@/services/requestService';
import { listenToStaffMembers, getAllStaffMembers } from '@/services/staffService'; 
import { listenToGarages, getAllGarages } from '@/services/garageService'; 


const DEFAULT_VEHICLE_INFO: VehicleInfo = { make: 'Unknown', model: 'Unknown', year: 'N/A', licensePlate: 'N/A' };

export default function GarageAdminPage() {
  const { user, role, loading: authLoading, isFirebaseReady } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [garageProviders, setGarageProviders] = useState<ServiceProvider[]>([]); 
  const [isLoadingData, setIsLoadingData] = useState(true); 
  const [selectedGarage, setSelectedGarage] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const prevPendingCountRef = useRef<number>(0);
  const initialLoadRef = useRef(true);

  const [requestToAssign, setRequestToAssign] = useState<ServiceRequest | null>(null);

  const loadInitialData = useCallback(async () => {
    if (!isFirebaseReady) {
      setIsLoadingData(false); 
      return;
    }
    setIsLoadingData(true);
    try {
      const initialRequestsData = await getAllRequests(); 
      const processedRequests = initialRequestsData.map(r => ({
          ...r,
          vehicleInfo: r.vehicleInfo || DEFAULT_VEHICLE_INFO,
          requestTime: new Date(r.requestTime as Date) 
      })).sort((a, b) => (new Date(b.requestTime)).getTime() - (new Date(a.requestTime)).getTime());
      setRequests(processedRequests);

      const initialGaragesData = await getAllGarages();
      setGarageProviders(initialGaragesData);

      if (user && (role === 'admin' || role === 'mechanic' || role === 'customer_relations')) {
        const initialStaffData = await getAllStaffMembers(); 
        setStaffMembers(initialStaffData);
      }

      if (initialLoadRef.current) {
        toast({
          title: "Data Loaded",
          description: "Successfully fetched initial records from Firestore.",
          variant: "default",
          duration: 4000,
        });
        const currentPendingCount = initialRequestsData.filter(req => req.status === 'Pending' && !req.cancellationRequested).length;
        prevPendingCountRef.current = currentPendingCount;
        initialLoadRef.current = false; 
      }
    } catch (error) {
      console.error("Error loading initial data from Firestore:", error);
      toast({ title: "Error Loading Data", description: "Could not fetch initial records.", variant: "destructive" });
      if (initialLoadRef.current) {
        initialLoadRef.current = false; 
      }
    } finally {
      setIsLoadingData(false);
    }
  }, [role, toast, isFirebaseReady, user]); 

 useEffect(() => {
    if (!authLoading) { 
      if (!user && isFirebaseReady) {
        router.push('/login?redirect=/garage-admin');
      } else if (user && isFirebaseReady && initialLoadRef.current) { 
        loadInitialData();
      } else if (!isFirebaseReady && initialLoadRef.current) {
        setIsLoadingData(false);
        initialLoadRef.current = false;
      }
    }
  }, [authLoading, user, router, loadInitialData, isFirebaseReady]);


  useEffect(() => {
    if (!user || !isFirebaseReady) return; 
    const unsubscribeRequests = listenToRequests((updatedRequests) => { 
      const processedRequests = updatedRequests.map(r => ({
        ...r,
        vehicleInfo: r.vehicleInfo || DEFAULT_VEHICLE_INFO,
        requestTime: new Date(r.requestTime as Date)
      })).sort((a, b) => (new Date(b.requestTime)).getTime() - (new Date(a.requestTime)).getTime());
      
      const currentPendingCount = processedRequests.filter(req => req.status === 'Pending' && !req.cancellationRequested).length;
      const cancellationRequestsCount = processedRequests.filter(req => req.cancellationRequested && req.status === 'Pending').length;
      
      if (!initialLoadRef.current && currentPendingCount > prevPendingCountRef.current) {
         toast({
            title: "🔔 New Pending Request!",
            description: `A new service request has been logged. ${currentPendingCount} pending.`,
            variant: "default",
            duration: 7000,
          });
      } else if (!initialLoadRef.current && currentPendingCount < prevPendingCountRef.current && prevPendingCountRef.current > 0) {
         toast({
            title: "ℹ️ Pending Requests Updated",
            description: `Number of pending requests changed from ${prevPendingCountRef.current} to ${currentPendingCount}.`,
            duration: 4000,
        });
      }
      if (!initialLoadRef.current && cancellationRequestsCount > 0) {
         toast({
            title: "⚠️ Cancellation Requested",
            description: `${cancellationRequestsCount} request(s) have pending cancellation. Please review.`,
            variant: "default", // Or a warning variant if you have one
            duration: 8000,
          });
      }
      prevPendingCountRef.current = currentPendingCount;
      setRequests(processedRequests);
      if (isLoadingData && !initialLoadRef.current) setIsLoadingData(false); 
    });
    return () => unsubscribeRequests(); 
  }, [user, toast, isLoadingData, isFirebaseReady]); 

  useEffect(() => {
    if (!user || !isFirebaseReady || !['admin', 'mechanic', 'customer_relations'].includes(role || '')) return; 
    const unsubscribeStaff = listenToStaffMembers(setStaffMembers);
    return () => unsubscribeStaff();
  }, [user, role, isFirebaseReady]);

  useEffect(() => {
    if (!user || !isFirebaseReady) return;
    const unsubscribeGarages = listenToGarages(setGarageProviders);
    return () => unsubscribeGarages();
  }, [user, isFirebaseReady]);


  const handleStatusChange = async (requestId: string, newStatus: ServiceRequest['status'], notes?: string, resources?: string) => {
    let requestNeedsAssignment = false;
    const currentRequest = requests.find(req => req.id === requestId);
    if (!currentRequest) return;

    if (currentRequest.cancellationRequested && currentRequest.status === 'Pending' && newStatus !== 'Cancelled'){
        toast({ title: "Action Blocked", description: "Please respond to the user's cancellation request before changing status.", variant: "destructive"});
        return;
    }

    const updateData: Partial<Omit<ServiceRequest, 'id' | 'requestTime'>> = { status: newStatus };
    if (notes !== undefined) updateData.mechanicNotes = notes;
    if (resources !== undefined) updateData.resourcesUsed = resources;

    try {
      await updateServiceRequest(requestId, updateData); 

      if (role === 'admin' && newStatus === 'Accepted' && !currentRequest.assignedStaffId) {
        requestNeedsAssignment = true;
        const potentiallyUpdatedRequest = { ...currentRequest, ...updateData } as ServiceRequest;
        setRequestToAssign(potentiallyUpdatedRequest); 
      }
      
      if (!requestNeedsAssignment) {
        toast({
          title: "Status Updated",
          description: `Request ${currentRequest.requestId.slice(0,10)}... status changed to ${newStatus}.`,
        });
      }
    } catch (error) {
      console.error("Error updating request status:", error);
      toast({ title: "Update Failed", description: "Could not update request status.", variant: "destructive" });
    }
  };
  
  const handleAssignStaff = async (requestId: string, staffId: string | null) => {
    try {
      await updateServiceRequest(requestId, { assignedStaffId: staffId === null ? undefined : staffId }); 
      const staffName = staffMembers.find(s => s.id === staffId)?.name || 'Unassigned';
      toast({
        title: "Request Assignment Updated",
        description: `Request ${requests.find(r=>r.id === requestId)?.requestId.slice(0,10)}... assigned to ${staffName}.`,
      });
      setRequestToAssign(null); 
    } catch (error) {
      console.error("Error assigning staff:", error);
      toast({ title: "Assignment Failed", description: "Could not assign staff to the request.", variant: "destructive" });
    }
  };

  const handleRespondToCancellation = async (requestId: string, approved: boolean, responseNotes?: string) => {
    try {
        await respondToCancellationRequest(requestId, approved, responseNotes);
        toast({
            title: `Cancellation ${approved ? 'Approved' : 'Denied'}`,
            description: `Response sent for request ${requests.find(r => r.id === requestId)?.requestId.slice(0,10)}...`,
        });
    } catch (error) {
        console.error("Error responding to cancellation:", error);
        toast({ title: "Response Failed", description: "Could not process cancellation response.", variant: "destructive" });
    }
  };


  const getVisibleRequests = () => {
    let filtered = requests;
    if (role === 'mechanic' && user && user.email) {
      const mechanicStaffProfile = staffMembers.find(staff => staff.email.toLowerCase() === user.email!.toLowerCase() && staff.role === 'mechanic');
      if (mechanicStaffProfile) {
        filtered = filtered.filter(req => req.assignedStaffId === mechanicStaffProfile.id);
      } else {
        if (!isLoadingData && staffMembers.length > 0) { 
             console.warn(`Mechanic profile for ${user.email} not found in staff list. Showing no assigned requests.`);
        }
        filtered = []; 
      }
    }
    return filtered.filter(req => {
      const garageMatch = selectedGarage === 'all' || (req.selectedProvider && req.selectedProvider.id === selectedGarage);
      const statusMatch = selectedStatus === 'all' || req.status === selectedStatus;
      return garageMatch && statusMatch;
    });
  };
  
  const visibleRequests = getVisibleRequests();

  const allMechanics = staffMembers.filter(s => s.role === 'mechanic');
  const requestsInProgress = requests.filter(req => req.status === 'In Progress');
  const occupiedMechanicIds = new Set(requestsInProgress.map(req => req.assignedStaffId).filter(id => !!id));
  const assignableMechanics = allMechanics.filter(mech => !occupiedMechanicIds.has(mech.id));

  const refreshData = () => { 
    initialLoadRef.current = true; 
    loadInitialData(); 
    setSelectedGarage('all');
    setSelectedStatus('all');
    toast({
      title: "Data Refresh Initiated",
      description: "Attempting to reload all data.",
      duration: 3000
    });
  }

  if (authLoading || (isLoadingData && initialLoadRef.current && isFirebaseReady)) { 
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3">Loading data...</p>
      </div>
    );
  }

  if (!user && !authLoading && isFirebaseReady) { 
    return (
        <div className="flex-grow flex items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
             <p className="ml-4">Redirecting to login...</p>
        </div>
    );
  }
  
  if (!isFirebaseReady && !authLoading) { 
     return (
        <div className="flex-grow flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center shadow-xl">
                <CardHeader>
                    <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <CardTitle>Service Unavailable</CardTitle>
                    <CardDescription>Cannot connect to services. Please try again later.</CardDescription>
                </CardHeader>
                 <CardFooter>
                    <Button onClick={() => window.location.reload()} className="w-full">
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh Page
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  if (!role || !['admin', 'mechanic', 'customer_relations'].includes(role)) { 
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>You do not have permission to view this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This area is restricted to authorized personnel.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" /> Go to Homepage
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const pendingRequestCount = requests.filter(req => req.status === 'Pending' && !req.cancellationRequested).length;
  const pendingCancellationsCount = requests.filter(req => req.cancellationRequested && req.status === 'Pending').length;
  
  let currentRoleIcon = Users; 
  if (role === 'admin') currentRoleIcon = Briefcase; 
  if (role === 'mechanic') currentRoleIcon = WrenchIcon;


  return (
    <div className="flex-grow flex flex-col p-4 md:p-6 space-y-6">
      <Card className="shadow-md flex-shrink-0">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl md:text-3xl flex items-center">
                 {React.createElement(currentRoleIcon, { className: "mr-3 h-7 w-7 text-primary"})}
                 Garage Management Portal
              </CardTitle>
              <CardDescription>View and manage service operations. Logged in as: <span className="font-semibold capitalize">{role.replace('_', ' ')}</span></CardDescription>
            </div>
            {(pendingRequestCount > 0 || pendingCancellationsCount > 0) && (
                 <div className="relative">
                    <Bell className={`h-6 w-6 ${pendingCancellationsCount > 0 ? 'text-orange-500' : 'text-primary'} animate-pulse`} />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pendingCancellationsCount > 0 ? 'bg-orange-500' : 'bg-destructive'} opacity-75`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${pendingCancellationsCount > 0 ? 'bg-orange-600' : 'bg-red-600'}`}></span>
                    </span>
                 </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="flex flex-row items-center justify-center w-full max-w-lg mx-auto space-x-1">
          <TabsTrigger value="requests" className="inline-flex items-center justify-center rounded-sm p-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
            <ClipboardList className="h-5 w-5" />
            <span className="hidden sm:inline ml-2">Service Requests</span>
          </TabsTrigger>
          
          {role === 'admin' && (
            <TabsTrigger value="staff" className="inline-flex items-center justify-center rounded-sm p-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <Users className="h-5 w-5" />
              <span className="hidden sm:inline ml-2">Staff</span>
            </TabsTrigger>
          )}
          {role === 'admin' && (
            <TabsTrigger value="garages" className="inline-flex items-center justify-center rounded-sm p-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
              <Building className="h-5 w-5" />
              <span className="hidden sm:inline ml-2">Garages</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Service Requests</CardTitle>
              <CardDescription>Manage service requests below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center border-b pb-4">
                <Filter className="h-5 w-5 text-muted-foreground hidden sm:block" />
                <Select value={selectedGarage} onValueChange={setSelectedGarage}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by Garage Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Garage Branches</SelectItem>
                    {garageProviders.map(g => ( 
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {(['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled'] as ServiceRequest['status'][]).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={refreshData} variant="outline" className="w-full sm:w-auto sm:ml-auto">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Displaying {visibleRequests.length} of {requests.length} total requests. 
                ({pendingRequestCount} pending, {pendingCancellationsCount} pending cancellation)
              </p>
               {isLoadingData && staffMembers.length === 0 && role === 'mechanic' ? ( 
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-3">Loading your assigned requests...</p>
                </div>
              ) : isLoadingData && role !== 'mechanic' ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-3">Loading requests...</p>
                </div>
              ) : (
                <div className="min-h-[300px]"> 
                 <RequestList 
                    requests={visibleRequests} 
                    onStatusChange={handleStatusChange} 
                    onAssignStaff={role === 'admin' ? handleAssignStaff : undefined}
                    staffList={staffMembers} 
                    assignableStaffList={assignableMechanics} 
                    currentUserRole={role || 'user'} 
                    currentUserId={user?.uid} 
                    currentUserEmail={user?.email || undefined}
                    onRespondToCancellation={handleRespondToCancellation}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {role === 'admin' && (
          <TabsContent value="staff" className="mt-6">
            <StaffManagement /> 
          </TabsContent>
        )}
        {role === 'admin' && (
          <TabsContent value="garages" className="mt-6">
            <GarageManagement /> 
          </TabsContent>
        )}
      </Tabs>
      {requestToAssign && role === 'admin' && (
        <AssignStaffDialog
          isOpen={!!requestToAssign}
          onClose={() => setRequestToAssign(null)}
          requestId={requestToAssign.id}
          currentAssignedStaffId={requestToAssign.assignedStaffId}
          allMechanics={allMechanics} 
          availableMechanics={assignableMechanics} 
          onAssignStaff={handleAssignStaff}
        />
      )}
    </div>
  );
}

