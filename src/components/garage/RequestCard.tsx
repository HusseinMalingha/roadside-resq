
// src/components/garage/RequestCard.tsx
"use client";

import type { FC } from 'react';
import type { ServiceRequest } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Phone, Wrench, CheckCircle, Send, XCircle, Hourglass, CarIcon } from 'lucide-react'; // Added CarIcon
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RequestCardProps {
  request: ServiceRequest;
  onStatusChange: (requestId: string, newStatus: ServiceRequest['status']) => void;
}

const statusColors: Record<ServiceRequest['status'], string> = {
  Pending: 'bg-yellow-500',
  Accepted: 'bg-blue-500',
  'In Progress': 'bg-indigo-500',
  Completed: 'bg-green-500',
  Cancelled: 'bg-red-500',
};

const statusIcons: Record<ServiceRequest['status'], React.ElementType> = {
  Pending: Hourglass,
  Accepted: Send,
  'In Progress': Wrench,
  Completed: CheckCircle,
  Cancelled: XCircle,
};


const RequestCard: FC<RequestCardProps> = ({ request, onStatusChange }) => {
  const StatusIcon = statusIcons[request.status];
  return (
    <Card className="shadow-lg w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl mb-1">Request ID: {request.requestId}</CardTitle>
            <CardDescription className="text-sm">
              Received: {new Date(request.requestTime).toLocaleString()}
            </CardDescription>
          </div>
          <Badge className={`text-white ${statusColors[request.status]} flex items-center`}>
            <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
            {request.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <h4 className="font-semibold text-base mb-1">Issue: {request.issueSummary}</h4>
          <p className="text-muted-foreground text-xs italic">Details: {request.issueDescription || "Not provided"}</p>
        </div>
        {request.vehicleInfo && (
          <div className="pt-2 border-t mt-2">
            <h5 className="font-medium text-sm mb-1">Vehicle Information:</h5>
            <div className="flex items-center text-xs text-muted-foreground">
                <CarIcon className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                <span>
                    {request.vehicleInfo.make} {request.vehicleInfo.model} ({request.vehicleInfo.year}) - Plate: {request.vehicleInfo.licensePlate}
                </span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t mt-2">
            <div className="space-y-1">
                <div className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-primary" />
                    <span>Client: {request.userName || "N/A"}</span>
                </div>
                <div className="flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-primary" />
                    <span>Contact: {request.userPhone || "N/A"}</span>
                </div>
            </div>
            <div className="space-y-1">
                <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-primary" />
                    <span>Location: {request.userLocation.lat.toFixed(4)}, {request.userLocation.lng.toFixed(4)}</span>
                </div>
                 <div className="flex items-center">
                    <Wrench className="mr-2 h-4 w-4 text-primary" />
                    <span>Provider: {request.selectedProvider.name}</span>
                </div>
            </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 p-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Assigned to: {request.selectedProvider.name}</p>
        <Select 
          value={request.status}
          onValueChange={(newStatus: ServiceRequest['status']) => onStatusChange(request.id, newStatus)}
        >
          <SelectTrigger className="w-[180px] text-xs py-1 h-9">
            <SelectValue placeholder="Update status" />
          </SelectTrigger>
          <SelectContent>
            {(['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled'] as ServiceRequest['status'][]).map(s => (
              <SelectItem key={s} value={s} className="text-xs">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardFooter>
    </Card>
  );
};

export default RequestCard;
