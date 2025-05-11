
"use client";

import type { FC } from 'react';
import type { ServiceRequest } from '@/types';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Keep Card for styling consistency if needed, or remove if AccordionItem is sufficient
import { Badge } from '@/components/ui/badge';
import { CalendarDays, CarIcon, Wrench, MapPin, AlertCircle, CheckCircle, Hourglass, Send, ShieldQuestion, ChevronDown } from 'lucide-react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface RequestHistoryItemProps {
  request: ServiceRequest;
}

const statusDetails: Record<ServiceRequest['status'], { color: string; icon: React.ElementType; label: string }> = {
  Pending: { color: 'bg-yellow-500', icon: Hourglass, label: 'Pending' },
  Accepted: { color: 'bg-blue-500', icon: Send, label: 'Accepted' },
  'In Progress': { color: 'bg-indigo-500', icon: Wrench, label: 'In Progress' },
  Completed: { color: 'bg-green-500', icon: CheckCircle, label: 'Completed' },
  Cancelled: { color: 'bg-red-500', icon: AlertCircle, label: 'Cancelled' },
};

const RequestHistoryItem: FC<RequestHistoryItemProps> = ({ request }) => {
  const currentStatus = statusDetails[request.status] || { color: 'bg-gray-400', icon: ShieldQuestion, label: request.status };
  const StatusIcon = currentStatus.icon;

  return (
    <AccordionItem value={request.id} className="border-b-0">
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 w-full">
        <AccordionTrigger className="w-full p-0 hover:no-underline">
          <CardHeader className="w-full pb-3 cursor-pointer">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 w-full">
              <div className="flex-grow text-left">
                <CardTitle className="text-lg md:text-xl">Issue: {request.issueSummary}</CardTitle>
                <CardDescription className="text-xs md:text-sm">Request ID: {request.requestId}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${currentStatus.color} text-white self-start sm:self-center text-xs sm:text-sm whitespace-nowrap`}>
                  <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
                  {currentStatus.label}
                </Badge>
                {/* Chevron will be automatically added by AccordionTrigger, but if we want custom one: */}
                {/* <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-muted-foreground group-data-[state=open]:rotate-180" /> */}
              </div>
            </div>
          </CardHeader>
        </AccordionTrigger>
        <AccordionContent>
          <div className="px-6 pb-4 pt-0 space-y-2.5 text-sm md:text-base"> {/* Apply CardContent-like padding */}
            <div className="flex items-center text-muted-foreground">
              <CalendarDays className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
              <span>Date: {new Date(request.requestTime).toLocaleDateString()} at {new Date(request.requestTime).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Wrench className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
              <span>Provider: {request.selectedProvider.name}</span>
            </div>
            {request.vehicleInfo && (
              <div className="flex items-center text-muted-foreground">
                <CarIcon className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                <span>Vehicle: {request.vehicleInfo.make} {request.vehicleInfo.model} ({request.vehicleInfo.licensePlate})</span>
              </div>
            )}
            <div className="flex items-center text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                <span>Location: {request.userLocation.lat.toFixed(3)}, {request.userLocation.lng.toFixed(3)}</span>
            </div>
            {request.issueDescription && (
                <p className="text-xs italic text-muted-foreground pt-1">
                    Details: "{request.issueDescription}"
                </p>
            )}
          </div>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
};

export default RequestHistoryItem;
