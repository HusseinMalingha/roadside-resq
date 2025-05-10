
// src/app/garage-admin/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ServiceRequest, ServiceProvider, VehicleInfo } from '@/types';
import RequestList from '@/components/garage/RequestList';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, RefreshCw, Loader2, ShieldAlert, Home, Bell, Inbox } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getRequestsFromStorage, saveRequestsToStorage, LOCAL_STORAGE_REQUESTS_KEY } from '@/lib/localStorageUtils';

// Mock Data for Garages - this can remain as it's static provider info
const MOCK_GARAGES: ServiceProvider[] = [
  { id: 'ax-kampala-central', name: 'Auto Xpress - Kampala Central', phone: '(256) 772-123456', etaMinutes: 0, currentLocation: {lat:0.3136, lng:32.5811}, generalLocation: "Kampala Central", servicesOffered: ['Tire Services', 'Battery Replacement', 'Oil Change'] },
  { id: 'ax-lugogo', name: 'Auto Xpress - Lugogo', phone: '(256) 772-234567', etaMinutes: 0, currentLocation: {lat:0.3270, lng:32.5990}, generalLocation: "Lugogo", servicesOffered: ['Suspension Work', 'Diagnostics'] },
  { id: 'ax-ntinda', name: 'Auto Xpress - Ntinda', phone: '(256) 772-345678', etaMinutes: 0, currentLocation: {lat:0.3450, lng:32.6120}, generalLocation: "Ntinda", servicesOffered: ['Fuel Delivery', 'Battery Testing'] },
  { id: 'ax-acacia', name: 'Auto Xpress - Acacia Mall', phone: '(256) 772-456789', etaMinutes: 0, currentLocation: {lat:0.3312, lng:32.5900}, generalLocation: "Kololo", servicesOffered: ['Tire Sales & Fitting', 'Oil and Filter Change'] },
  { id: 'ax-nakawa', name: 'Auto Xpress - Nakawa', phone: '(256) 772-678901', etaMinutes: 0, currentLocation: {lat:0.3300, lng:32.6150}, generalLocation: "Nakawa", servicesOffered: ['Full Service Maintenance', 'Tire Balancing'] },
  { id: 'ax-entebbe-victoria-mall', name: 'Auto Xpress - Victoria Mall Entebbe', phone: '(256) 772-567890', etaMinutes: 0, currentLocation: {lat:0.0530, lng:32.4640}, generalLocation: "Entebbe", servicesOffered: ['Battery Jump Start', 'Tire Inflation & Repair'] },
];

const DEFAULT_VEHICLE_INFO: VehicleInfo = { make: 'Unknown', model: 'Unknown', year: 'N/A', licensePlate: 'N/A' };


export default function GarageAdminPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [selectedGarage, setSelectedGarage] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const prevPendingCountRef = useRef<number>(0);
  const initialLoadRef = useRef(true);


  const loadRequests = useCallback(() => {
    setIsLoadingRequests(true);
    const storedRequests = getRequestsFromStorage();
    // Ensure vehicleInfo has defaults if missing
    const processedRequests = storedRequests.map(r => ({
        ...r,
        vehicleInfo: r.vehicleInfo || DEFAULT_VEHICLE_INFO,
        requestTime: new Date(r.requestTime) // Ensure requestTime is a Date object
    })).sort((a, b) => b.requestTime.getTime() - a.requestTime.getTime()); // Sort by most recent
    setRequests(processedRequests);
    setIsLoadingRequests(false);
    return processedRequests;
  }, []);
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/garage-admin');
    } else if (user) {
      const loadedRequests = loadRequests();
      const currentPendingCount = loadedRequests.filter(req => req.status === 'Pending').length;
      prevPendingCountRef.current = currentPendingCount; // Initialize prev count on load
      initialLoadRef.current = false;
    }
  }, [authLoading, user, router, loadRequests]);


  useEffect(() => {
    // Listener for localStorage changes from other tabs/windows (optional, but good for sync)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_REQUESTS_KEY) {
        const newRequests = loadRequests();
        const currentPendingCount = newRequests.filter(req => req.status === 'Pending').length;

        if (currentPendingCount > prevPendingCountRef.current) {
          toast({
            title: "🔔 New Pending Request(s)!",
            description: `A new service request has been logged. ${currentPendingCount} pending.`,
            variant: "default",
            duration: 7000,
          });
        }
        prevPendingCountRef.current = currentPendingCount;
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadRequests, toast]);


  // Notification logic for new requests or changes in pending count
  useEffect(() => {
    if (initialLoadRef.current || isLoadingRequests) return; // Don't run on initial load until requests are set

    const currentPendingRequests = requests.filter(req => req.status === 'Pending');
    const currentPendingCount = currentPendingRequests.length;
    
    if (currentPendingCount > prevPendingCountRef.current) {
      toast({
        title: "🔔 New Pending Service Request(s)",
        description: `You have ${currentPendingCount} pending request(s). ${currentPendingCount - prevPendingCountRef.current} new.`,
        variant: "default",
        duration: 6000,
      });
    } else if (currentPendingCount < prevPendingCountRef.current && prevPendingCountRef.current > 0) {
        // This case might be a status change from Pending to something else
        toast({
            title: "ℹ️ Pending Requests Updated",
            description: `Number of pending requests changed from ${prevPendingCountRef.current} to ${currentPendingCount}.`,
            duration: 4000,
        });
    }
    // Update ref after comparison
    prevPendingCountRef.current = currentPendingCount;
  }, [requests, toast, isLoadingRequests]);


  const handleStatusChange = (requestId: string, newStatus: ServiceRequest['status']) => {
    const updatedRequests = requests.map(req =>
      req.id === requestId ? { ...req, status: newStatus } : req
    );
    setRequests(updatedRequests);
    saveRequestsToStorage(updatedRequests); // Save changes to localStorage
    toast({
      title: "Status Updated",
      description: `Request ${requestId.slice(0,10)}... status changed to ${newStatus}.`,
    });
  };

  const filteredRequests = requests.filter(req => {
    const garageMatch = selectedGarage === 'all' || (req.selectedProvider && req.selectedProvider.id === selectedGarage);
    const statusMatch = selectedStatus === 'all' || req.status === selectedStatus;
    return garageMatch && statusMatch;
  });
  
  const refreshData = () => {
    loadRequests();
    setSelectedGarage('all');
    setSelectedStatus('all');
    toast({
      title: "Data Refreshed",
      description: "Request list has been updated from storage.",
      duration: 3000
    });
  }

  if (authLoading || isLoadingRequests && initialLoadRef.current) { // Show loader on initial data load too
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3">Loading requests...</p>
      </div>
    );
  }

  if (!user && !authLoading) { // Redirect if not logged in and auth is done loading
    return (
        <div className="flex-grow flex items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
             <p className="ml-4">Redirecting to login...</p>
        </div>
    );
  }

  if (role !== 'admin' && role !== 'mechanic') {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>You do not have permission to view this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This area is restricted to garage administrators and mechanics.</p>
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

  const pendingRequestCount = requests.filter(req => req.status === 'Pending').length;

  return (
    <div className="flex-grow flex flex-col p-4 md:p-6 space-y-6">
      <Card className="shadow-md flex-shrink-0">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl md:text-3xl">Garage Service Requests</CardTitle>
              <CardDescription>View and manage incoming roadside assistance requests. Logged in as: <span className="font-semibold capitalize">{role}</span></CardDescription>
            </div>
            {pendingRequestCount > 0 && (
                 <div className="relative">
                    <Bell className="h-6 w-6 text-primary animate-pulse" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                    </span>
                 </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center border-b pb-4">
            <Filter className="h-5 w-5 text-muted-foreground hidden sm:block" />
            <Select value={selectedGarage} onValueChange={setSelectedGarage}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by Garage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Garages</SelectItem>
                {MOCK_GARAGES.map(g => (
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
              Refresh
            </Button>
          </div>
           <p className="text-sm text-muted-foreground">
            Displaying {filteredRequests.length} of {requests.length} requests. 
            ({pendingRequestCount} pending)
          </p>
        </CardContent>
      </Card>
      
      {isLoadingRequests && !initialLoadRef.current ? ( // Loader when refreshing non-initially
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
           <p className="ml-3">Refreshing requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <Card className="flex-grow flex flex-col items-center justify-center text-center py-10">
            <CardContent>
                <Inbox className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="text-xl">No Service Requests Logged</CardTitle>
                <CardDescription className="mt-2">There are currently no user-submitted requests.</CardDescription>
            </CardContent>
        </Card>
      ) : (
        <div className="flex-grow flex flex-col min-h-0">
         <RequestList requests={filteredRequests} onStatusChange={handleStatusChange} />
        </div>
      )}
      
    </div>
  );
}

