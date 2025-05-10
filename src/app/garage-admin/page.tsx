
// src/app/garage-admin/page.tsx
"use client";

import { useState, useEffect } from 'react';
import type { ServiceRequest, ServiceProvider } from '@/types';
import RequestList from '@/components/garage/RequestList';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, RefreshCw, Loader2, ShieldAlert, Home } from 'lucide-react';
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

// Mock Data - In a real app, this would come from a backend
const MOCK_GARAGES: ServiceProvider[] = [
  { id: 'ax1', name: 'Auto Xpress - Kampala Central', phone: '...', etaMinutes: 0, currentLocation: {lat:0, lng:0}, generalLocation: "Kampala Central", servicesOffered: [] },
  { id: 'ax2', name: 'Auto Xpress - Lugogo', phone: '...', etaMinutes: 0, currentLocation: {lat:0, lng:0}, generalLocation: "Lugogo", servicesOffered: [] },
  { id: 'ax3', name: 'Auto Xpress - Ntinda', phone: '...', etaMinutes: 0, currentLocation: {lat:0, lng:0}, generalLocation: "Ntinda", servicesOffered: [] },
];

const INITIAL_MOCK_REQUESTS: ServiceRequest[] = [
  {
    id: 'req1',
    requestId: 'RR-001',
    userLocation: { lat: 0.3150, lng: 32.5830 },
    issueDescription: 'Car is making a loud screeching noise from the front when braking. Seems urgent.',
    issueSummary: 'Brake Failure',
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

  const [requests, setRequests] = useState<ServiceRequest[]>(INITIAL_MOCK_REQUESTS);
  const [selectedGarage, setSelectedGarage] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/garage-admin');
    }
  }, [authLoading, user, router]);

  const handleStatusChange = (requestId: string, newStatus: ServiceRequest['status']) => {
    setRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId ? { ...req, status: newStatus } : req
      )
    );
  };

  const filteredRequests = requests.filter(req => {
    const garageMatch = selectedGarage === 'all' || req.selectedProvider.id === selectedGarage;
    const statusMatch = selectedStatus === 'all' || req.status === selectedStatus;
    return garageMatch && statusMatch;
  });
  
  const refreshData = () => {
    setRequests([...INITIAL_MOCK_REQUESTS.map(r => ({...r, requestTime: new Date(r.requestTime.getTime() + 1000)}))]); 
    setSelectedGarage('all');
    setSelectedStatus('all');
  }

  if (authLoading) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Should be redirected by useEffect, but as a fallback:
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
        <Card className="max-w-md shadow-xl">
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
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">Garage Service Requests</CardTitle>
          <CardDescription>View and manage incoming roadside assistance requests. Logged in as: <span className="font-semibold capitalize">{role}</span></CardDescription>
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
            <Button onClick={refreshData} variant="outline" className="w-full sm:w-auto ml-auto">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
           <p className="text-sm text-muted-foreground">
            Displaying {filteredRequests.length} of {requests.length} requests.
          </p>
        </CardContent>
      </Card>
      
      <RequestList requests={filteredRequests} onStatusChange={handleStatusChange} />
      
    </div>
  );
}
