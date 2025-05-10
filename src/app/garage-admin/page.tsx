
// src/app/garage-admin/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ServiceRequest, ServiceProvider, VehicleInfo, StaffMember } from '@/types';
import RequestList from '@/components/garage/RequestList';
import StaffManagement from '@/components/garage/StaffManagement';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, RefreshCw, Loader2, ShieldAlert, Home, Bell, Users, WrenchIcon, Briefcase } from 'lucide-react';
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
import { getRequestsFromStorage, saveRequestsToStorage, LOCAL_STORAGE_REQUESTS_KEY, getStaffMembersFromStorage } from '@/lib/localStorageUtils';

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
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true); // Combined loading state
  const [selectedGarage, setSelectedGarage] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const prevPendingCountRef = useRef<number>(0);
  const initialLoadRef = useRef(true);

  const loadData = useCallback(() => {
    setIsLoadingData(true);
    const storedRequests = getRequestsFromStorage();
    const processedRequests = storedRequests.map(r => ({
        ...r,
        vehicleInfo: r.vehicleInfo || DEFAULT_VEHICLE_INFO,
        requestTime: new Date(r.requestTime)
    })).sort((a, b) => b.requestTime.getTime() - a.requestTime.getTime());
    setRequests(processedRequests);

    if (role === 'admin') {
      const storedStaff = getStaffMembersFromStorage();
      setStaffMembers(storedStaff);
    }
    setIsLoadingData(false);
    return processedRequests;
  }, [role]);
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/garage-admin');
    } else if (user) {
      const loadedRequests = loadData();
      if (initialLoadRef.current) {
        const currentPendingCount = loadedRequests.filter(req => req.status === 'Pending').length;
        prevPendingCountRef.current = currentPendingCount;
        initialLoadRef.current = false;
      }
    }
  }, [authLoading, user, router, loadData]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_REQUESTS_KEY) {
        const newRequests = loadData(); // Reloads both requests and staff if admin
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
      // Could also listen for staff changes if needed for real-time updates from other admin tabs
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadData, toast, role]);

  useEffect(() => {
    if (initialLoadRef.current || isLoadingData) return;

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
        toast({
            title: "ℹ️ Pending Requests Updated",
            description: `Number of pending requests changed from ${prevPendingCountRef.current} to ${currentPendingCount}.`,
            duration: 4000,
        });
    }
    prevPendingCountRef.current = currentPendingCount;
  }, [requests, toast, isLoadingData]);

  const handleStatusChange = (requestId: string, newStatus: ServiceRequest['status'], notes?: string, resources?: string) => {
    const updatedRequests = requests.map(req => {
      if (req.id === requestId) {
        const updatedReq = { ...req, status: newStatus };
        if (notes !== undefined) updatedReq.mechanicNotes = notes;
        if (resources !== undefined) updatedReq.resourcesUsed = resources;
        return updatedReq;
      }
      return req;
    });
    setRequests(updatedRequests);
    saveRequestsToStorage(updatedRequests);
    toast({
      title: "Status Updated",
      description: `Request ${requestId.slice(0,10)}... status changed to ${newStatus}.`,
    });
  };
  
  const handleAssignStaff = (requestId: string, staffId: string | null) => {
    const updatedRequests = requests.map(req =>
      req.id === requestId ? { ...req, assignedStaffId: staffId || undefined } : req
    );
    setRequests(updatedRequests);
    saveRequestsToStorage(updatedRequests);
    const staffName = staffMembers.find(s => s.id === staffId)?.name || 'Unassigned';
    toast({
      title: "Request Assignment Updated",
      description: `Request ${requestId.slice(0,10)}... assigned to ${staffName}.`,
    });
  };

  const getVisibleRequests = () => {
    let filtered = requests;
    if (role === 'mechanic' && user) {
      // A mechanic sees requests assigned to their staff profile (matched by email)
      const mechanicStaffProfile = staffMembers.find(staff => staff.email.toLowerCase() === user.email?.toLowerCase() && staff.role === 'mechanic');
      if (mechanicStaffProfile) {
        filtered = filtered.filter(req => req.assignedStaffId === mechanicStaffProfile.id);
      } else {
        filtered = []; // Not a recognized mechanic staff member or no matching email
      }
    } else if (role === 'customer_relations') {
      // Customer relations might see all active requests or based on other criteria
      // For now, let's assume they see all non-completed/cancelled, similar to admin filter by default
      // This can be refined further.
    }

    // Apply garage and status filters
    return filtered.filter(req => {
      const garageMatch = selectedGarage === 'all' || (req.selectedProvider && req.selectedProvider.id === selectedGarage);
      const statusMatch = selectedStatus === 'all' || req.status === selectedStatus;
      return garageMatch && statusMatch;
    });
  };
  
  const visibleRequests = getVisibleRequests();

  const refreshData = () => {
    loadData();
    setSelectedGarage('all');
    setSelectedStatus('all');
    toast({
      title: "Data Refreshed",
      description: "Request and staff list has been updated from storage.",
      duration: 3000
    });
  }

  if (authLoading || (isLoadingData && initialLoadRef.current)) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3">Loading data...</p>
      </div>
    );
  }

  if (!user && !authLoading) {
    return (
        <div className="flex-grow flex items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
             <p className="ml-4">Redirecting to login...</p>
        </div>
    );
  }

  if (role !== 'admin' && role !== 'mechanic' && role !== 'customer_relations') {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>You do not have permission to view this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This area is restricted to authorized garage personnel.</p>
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
  const currentRoleIcon = role === 'admin' ? Users : role === 'mechanic' ? WrenchIcon : Briefcase;

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
              <CardDescription>View and manage service operations. Logged in as: <span className="font-semibold capitalize">{role}</span></CardDescription>
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
      </Card>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 max-w-md">
          <TabsTrigger value="requests">Service Requests</TabsTrigger>
          {role === 'admin' && <TabsTrigger value="staff">Staff Management</TabsTrigger>}
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Service Requests</CardTitle>
              <CardDescription>Filter and manage incoming and ongoing requests.</CardDescription>
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
                  Refresh Data
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Displaying {visibleRequests.length} of {requests.length} total requests. 
                ({pendingRequestCount} pending)
              </p>
               {isLoadingData && !initialLoadRef.current ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-3">Refreshing requests...</p>
                </div>
              ) : (
                <div className="min-h-[300px]"> {/* Ensure list has some height */}
                 <RequestList 
                    requests={visibleRequests} 
                    onStatusChange={handleStatusChange} 
                    onAssignStaff={role === 'admin' ? handleAssignStaff : undefined}
                    staffList={staffMembers.filter(s => s.role === 'mechanic')} // Pass only mechanics for assignment
                    currentUserRole={role}
                    currentUserId={user?.uid} // Or email, depending on how you identify mechanics
                    currentUserEmail={user?.email}
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
      </Tabs>
    </div>
  );
}
