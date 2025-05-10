
// src/app/garage-admin/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import type { ServiceRequest, ServiceProvider, VehicleInfo } from '@/types';
import RequestList from '@/components/garage/RequestList';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, RefreshCw, Loader2, ShieldAlert, Home, Bell } from 'lucide-react';
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

// Mock Data - In a real app, this would come from a backend
const MOCK_GARAGES: ServiceProvider[] = [
  { id: 'ax-kampala-central', name: 'Auto Xpress - Kampala Central', phone: '(256) 772-123456', etaMinutes: 0, currentLocation: {lat:0.3136, lng:32.5811}, generalLocation: "Kampala Central", servicesOffered: ['Tire Services', 'Battery Replacement', 'Oil Change'] },
  { id: 'ax-lugogo', name: 'Auto Xpress - Lugogo', phone: '(256) 772-234567', etaMinutes: 0, currentLocation: {lat:0.3270, lng:32.5990}, generalLocation: "Lugogo", servicesOffered: ['Suspension Work', 'Diagnostics'] },
  { id: 'ax-ntinda', name: 'Auto Xpress - Ntinda', phone: '(256) 772-345678', etaMinutes: 0, currentLocation: {lat:0.3450, lng:32.6120}, generalLocation: "Ntinda", servicesOffered: ['Fuel Delivery', 'Battery Testing'] },
  { id: 'ax-acacia', name: 'Auto Xpress - Acacia Mall', phone: '(256) 772-456789', etaMinutes: 0, currentLocation: {lat:0.3312, lng:32.5900}, generalLocation: "Kololo", servicesOffered: ['Tire Sales & Fitting', 'Oil and Filter Change'] },
  { id: 'ax-nakawa', name: 'Auto Xpress - Nakawa', phone: '(256) 772-678901', etaMinutes: 0, currentLocation: {lat:0.3300, lng:32.6150}, generalLocation: "Nakawa", servicesOffered: ['Full Service Maintenance', 'Tire Balancing'] },
  { id: 'ax-entebbe-victoria-mall', name: 'Auto Xpress - Victoria Mall Entebbe', phone: '(256) 772-567890', etaMinutes: 0, currentLocation: {lat:0.0530, lng:32.4640}, generalLocation: "Entebbe", servicesOffered: ['Battery Jump Start', 'Tire Inflation & Repair'] },
];

const DEFAULT_VEHICLE_INFO: VehicleInfo = { make: 'Unknown', model: 'Unknown', year: 'N/A', licensePlate: 'N/A' };

const INITIAL_MOCK_REQUESTS: ServiceRequest[] = [
  {
    id: 'req1',
    requestId: 'RR-001',
    userLocation: { lat: 0.3150, lng: 32.5830 },
    issueDescription: 'Car is making a loud screeching noise from the front when braking. Seems urgent.',
    issueSummary: 'Brake Failure',
    vehicleInfo: { make: 'Toyota', model: 'Premio', year: '2012', licensePlate: 'UAB 123X' },
    selectedProvider: MOCK_GARAGES[0],
    requestTime: new Date(Date.now() - 1000 * 60 * 15), 
    status: 'Pending',
    userName: 'Aisha K.',
    userPhone: '256-700-111222'
  },
  {
    id: 'req2',
    requestId: 'RR-002',
    userLocation: { lat: 0.3300, lng: 32.5950 },
    issueDescription: 'My car won\'t start. It just clicks. I think the battery is dead.',
    issueSummary: 'Dead battery',
    vehicleInfo: { make: 'Honda', model: 'CRV', year: '2017', licensePlate: 'UBC 456Y' },
    selectedProvider: MOCK_GARAGES[1],
    requestTime: new Date(Date.now() - 1000 * 60 * 45), 
    status: 'Accepted',
    userName: 'John B.',
    userPhone: '256-777-333444'
  },
  {
    id: 'req3',
    requestId: 'RR-003',
    userLocation: { lat: 0.3400, lng: 32.6100 },
    issueDescription: 'I have a flat tire on the rear passenger side. I have a spare but need help changing it.',
    issueSummary: 'Flat tire',
    vehicleInfo: { make: 'Subaru', model: 'Forester', year: '2015', licensePlate: 'UAD 789Z' },
    selectedProvider: MOCK_GARAGES[2],
    requestTime: new Date(Date.now() - 1000 * 60 * 120), 
    status: 'In Progress',
    userName: 'Maria N.',
    userPhone: '256-755-555666'
  },
   {
    id: 'req4',
    requestId: 'RR-004',
    userLocation: { lat: 0.3000, lng: 32.5700 },
    issueDescription: 'Ran out of fuel on the highway. Need urgent delivery.',
    issueSummary: 'Fuel delivery',
    vehicleInfo: { make: 'Nissan', model: 'X-Trail', year: '2019', licensePlate: 'UBE 101A' },
    selectedProvider: MOCK_GARAGES[0],
    requestTime: new Date(Date.now() - 1000 * 60 * 5), 
    status: 'Pending',
    userName: 'David S.',
    userPhone: '256-788-777888'
  },
];

export default function GarageAdminPage() {
  const { user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [requests, setRequests] = useState<ServiceRequest[]>(INITIAL_MOCK_REQUESTS.map(r => ({...r, vehicleInfo: r.vehicleInfo || DEFAULT_VEHICLE_INFO})));
  const [selectedGarage, setSelectedGarage] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const prevPendingCountRef = useRef<number>(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/garage-admin');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const currentPendingRequests = requests.filter(req => req.status === 'Pending');
    const currentPendingCount = currentPendingRequests.length;

    if (currentPendingCount > 0 && currentPendingCount !== prevPendingCountRef.current) {
      toast({
        title: "🔔 Pending Service Requests Update",
        description: `You have ${currentPendingCount} pending request(s).`,
        variant: "default",
        duration: 6000,
      });
    } else if (currentPendingCount > 0 && prevPendingCountRef.current === 0 && currentPendingCount > 0) {
       toast({
        title: "🔔 New Pending Requests",
        description: `There are ${currentPendingCount} new pending request(s) to review.`,
        variant: "default",
        duration: 6000,
      });
    }
    prevPendingCountRef.current = currentPendingCount;
  }, [requests, toast]);


  const handleStatusChange = (requestId: string, newStatus: ServiceRequest['status']) => {
    setRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId ? { ...req, status: newStatus } : req
      )
    );
    toast({
      title: "Status Updated",
      description: `Request ${requestId.slice(0,6)}... status changed to ${newStatus}.`,
    });
  };

  const filteredRequests = requests.filter(req => {
    const garageMatch = selectedGarage === 'all' || req.selectedProvider.id === selectedGarage;
    const statusMatch = selectedStatus === 'all' || req.status === selectedStatus;
    return garageMatch && statusMatch;
  });
  
  const refreshData = () => {
    const now = Date.now();
    let newRequestsArray = INITIAL_MOCK_REQUESTS.map((r, index) => ({
      ...r,
      vehicleInfo: r.vehicleInfo || DEFAULT_VEHICLE_INFO,
      id: `req${index + 1}-${now}`, 
      requestTime: new Date(now - 1000 * 60 * (Math.random() * 120)), 
      status: ['Pending', 'Accepted', 'In Progress'][Math.floor(Math.random() * 3)] as ServiceRequest['status'] 
    }));

    // Simulate a new request being added for demonstration
    if (Math.random() > 0.5) { // 50% chance to add a new demo request
        const newDemoRequest: ServiceRequest = {
            id: `newReq-${now}`,
            requestId: `RR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
            userLocation: { lat: 0.3250 + (Math.random() - 0.5) * 0.05, lng: 32.5850 + (Math.random() - 0.5) * 0.05 },
            issueDescription: 'This is a brand new simulated request for demonstration purposes.',
            issueSummary: ['Lockout', 'Overheating', 'Unknown Noise'][Math.floor(Math.random() * 3)],
            vehicleInfo: { 
                make: ['Kia', 'Mazda', 'Ford'][Math.floor(Math.random() * 3)], 
                model: ['Sportage', 'CX-5', 'Ranger'][Math.floor(Math.random() * 3)], 
                year: (2010 + Math.floor(Math.random() * 13)).toString(), 
                licensePlate: `UCD ${Math.floor(Math.random()*900)+100}${['X','Y','Z'][Math.floor(Math.random()*3)]}` 
            },
            selectedProvider: MOCK_GARAGES[Math.floor(Math.random() * MOCK_GARAGES.length)],
            requestTime: new Date(),
            status: 'Pending', // New requests are typically pending
            userName: `Demo User ${Math.floor(Math.random()*100)}`,
            userPhone: `256-7${Math.floor(Math.random()*100000000).toString().padStart(8, '0')}`
        };
        newRequestsArray.unshift(newDemoRequest); // Add to the beginning of the array
        toast({
            title: "🎉 New Request Logged!",
            description: `Request ${newDemoRequest.requestId} for ${newDemoRequest.issueSummary} has been added.`,
            variant: "default",
            duration: 7000,
        });
    }
    
    setRequests(newRequestsArray);
    setSelectedGarage('all');
    setSelectedStatus('all');
    toast({
      title: "Data Refreshed",
      description: "Request list has been updated.",
      duration: 3000
    });
  }


  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
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

  return (
    <div className="flex-grow flex flex-col p-4 md:p-6 space-y-6">
      <Card className="shadow-md flex-shrink-0">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl md:text-3xl">Garage Service Requests</CardTitle>
              <CardDescription>View and manage incoming roadside assistance requests. Logged in as: <span className="font-semibold capitalize">{role}</span></CardDescription>
            </div>
            {requests.filter(req => req.status === 'Pending').length > 0 && (
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
            ({requests.filter(req => req.status === 'Pending').length} pending)
          </p>
        </CardContent>
      </Card>
      
      <div className="flex-grow flex flex-col min-h-0">
        <RequestList requests={filteredRequests} onStatusChange={handleStatusChange} />
      </div>
      
    </div>
  );
}
