
// src/components/garage/RequestCard.tsx
"use client";

import type { FC } from 'react';
import React, { useState } from 'react';
import type { ServiceRequest, StaffMember, UserRole } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Phone, Wrench, CheckCircle, Send, XCircle, Hourglass, CarIcon, UserCheck, UserPlus, Edit2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import AssignStaffDialog from './AssignStaffDialog'; 
import LogMechanicDetailsDialog from './LogMechanicDetailsDialog'; 

interface RequestCardProps {
  request: ServiceRequest;
  onStatusChange: (requestId: string, newStatus: ServiceRequest['status'], mechanicNotes?: string, resourcesUsed?: string) => void;
  onAssignStaff?: (requestId: string, staffId: string | null) => void; 
  staffList: StaffMember[]; // Full list of all staff for display purposes (including non-mechanics if any)
  assignableStaffList: StaffMember[]; // Filtered list of available mechanics for assignment
  currentUserRole: UserRole;
  currentUserId?: string; 
  currentUserEmail?: string; 
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

const RequestCard: FC<RequestCardProps> = ({ 
    request, 
    onStatusChange, 
    onAssignStaff, 
    staffList, // This is the full list of staff members from admin page
    assignableStaffList, // This is the pre-filtered list of *assignable* mechanics
    currentUserRole,
    currentUserEmail
}) => {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isLogDetailsDialogOpen, setIsLogDetailsDialogOpen] = useState(false);
  const [targetStatusOnSubmitForLogging, setTargetStatusOnSubmitForLogging] = useState<ServiceRequest['status']>(request.status);


  const StatusIcon = statusIcons[request.status];
  // Use staffList (all staff) to find the assigned mechanic for display purposes
  const assignedMechanic = staffList.find(staff => staff.id === request.assignedStaffId && staff.role === 'mechanic');

  const currentMechanicStaffProfile = staffList.find(s => s.email.toLowerCase() === currentUserEmail?.toLowerCase() && s.role === 'mechanic');
  const isCurrentUserAssignedMechanic = !!currentMechanicStaffProfile && request.assignedStaffId === currentMechanicStaffProfile.id;

  const handleLocalStatusChange = (newStatus: ServiceRequest['status']) => {
    if (currentUserRole === 'admin') {
      if (newStatus === 'Accepted' && !request.assignedStaffId && onAssignStaff) {
        onStatusChange(request.id, newStatus); 
      } else {
        onStatusChange(request.id, newStatus);
      }
    } else if (currentUserRole === 'mechanic' && isCurrentUserAssignedMechanic) {
      if (newStatus === 'Completed') {
        setTargetStatusOnSubmitForLogging('Completed');
        setIsLogDetailsDialogOpen(true); 
      } else if ((request.status === 'Accepted' && (newStatus === 'In Progress' || newStatus === 'Cancelled')) ||
                 (request.status === 'In Progress' && newStatus === 'Cancelled')) {
        onStatusChange(request.id, newStatus);
      }
    }
  };
  
  const handleLogSubmit = (notes: string, resources: string, statusToSet: ServiceRequest['status']) => {
    onStatusChange(request.id, statusToSet, notes, resources);
    setIsLogDetailsDialogOpen(false);
  };

  const handleOpenLogDetailsDialog = () => {
    setTargetStatusOnSubmitForLogging(request.status); 
    setIsLogDetailsDialogOpen(true);
  };

  const canAdminAssign = currentUserRole === 'admin' && onAssignStaff && request.status !== 'Completed' && request.status !== 'Cancelled';
  
  const allMechanicsFromStaffList = staffList.filter(s => s.role === 'mechanic');

  const availableStatusesForSelect: ServiceRequest['status'][] = 
    currentUserRole === 'admin' 
    ? ['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled']
    : currentUserRole === 'mechanic' && isCurrentUserAssignedMechanic
    ? (
        request.status === 'Accepted' ? ['Accepted', 'In Progress', 'Cancelled'] :
        request.status === 'In Progress' ? ['In Progress', 'Completed', 'Cancelled'] :
        [request.status]
      ) as ServiceRequest['status'][]
    : [request.status];


  return (
    <>
      <Card className="shadow-lg w-full">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
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

          <div className="pt-2 border-t mt-2">
            <h5 className="font-medium text-sm mb-1">Assignment & Contact:</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
              <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-primary" />
                  <span>Client: {request.userName || "N/A"}</span>
              </div>
              <div className="flex items-center">
                  <Phone className="mr-2 h-4 w-4 text-primary" />
                  <span>Contact: {request.userPhone || "N/A"}</span>
              </div>
              <div className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-primary" />
                  <span>Location: {request.userLocation.lat.toFixed(4)}, {request.userLocation.lng.toFixed(4)}</span>
              </div>
              <div className="flex items-center">
                  <Wrench className="mr-2 h-4 w-4 text-primary" />
                  <span>Servicing Branch: {request.selectedProvider.name}</span>
              </div>
               <div className="flex items-center">
                 {assignedMechanic ? <UserCheck className="mr-2 h-4 w-4 text-green-600" /> : <UserPlus className="mr-2 h-4 w-4 text-orange-500" />}
                <span>Assigned Mechanic: {assignedMechanic ? assignedMechanic.name : 'Unassigned'}</span>
              </div>
            </div>
          </div>

          {(request.mechanicNotes || request.resourcesUsed) && (
            <div className="pt-2 border-t mt-2">
              <h5 className="font-medium text-sm mb-1">Mechanic Logs:</h5>
              {request.mechanicNotes && <p className="text-xs">Notes: {request.mechanicNotes}</p>}
              {request.resourcesUsed && <p className="text-xs">Resources: {request.resourcesUsed}</p>}
            </div>
          )}

        </CardContent>
        <CardFooter className="bg-muted/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex-grow sm:flex-grow-0">
            {(currentUserRole === 'admin' || (currentUserRole === 'mechanic' && isCurrentUserAssignedMechanic)) && (
              <Select 
                value={request.status}
                onValueChange={(newStatus: ServiceRequest['status']) => handleLocalStatusChange(newStatus)}
                disabled={availableStatusesForSelect.length <= 1 && availableStatusesForSelect[0] === request.status || request.status === 'Completed' || request.status === 'Cancelled'}
              >
                <SelectTrigger className="w-full sm:w-[180px] text-xs py-1 h-9">
                  <SelectValue placeholder="Update status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatusesForSelect.map(s => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
             {currentUserRole === 'customer_relations' && (
                <p className="text-xs text-muted-foreground">Status: {request.status}</p>
            )}
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {canAdminAssign && (
              <Button size="sm" variant="outline" onClick={() => setIsAssignDialogOpen(true)} className="text-xs flex-1 sm:flex-initial">
                <UserPlus className="mr-1.5 h-3.5 w-3.5"/> {request.assignedStaffId ? 'Re-assign' : 'Assign'}
              </Button>
            )}
            {currentUserRole === 'mechanic' && isCurrentUserAssignedMechanic && (request.status === 'Accepted' || request.status === 'In Progress') && (
              <Button size="sm" variant="outline" onClick={handleOpenLogDetailsDialog} className="text-xs flex-1 sm:flex-initial">
                <Edit2 className="mr-1.5 h-3.5 w-3.5"/> Log Details
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {canAdminAssign && (
        <AssignStaffDialog
          isOpen={isAssignDialogOpen}
          onClose={() => setIsAssignDialogOpen(false)}
          requestId={request.id}
          currentAssignedStaffId={request.assignedStaffId}
          availableMechanics={assignableStaffList} 
          allMechanics={allMechanicsFromStaffList} // Pass all mechanics for name lookup
          onAssignStaff={(reqId, staffId) => {
            if(onAssignStaff) onAssignStaff(reqId, staffId);
            setIsAssignDialogOpen(false);
          }}
        />
      )}
      {(currentUserRole === 'mechanic' && isCurrentUserAssignedMechanic && (request.status === 'Accepted' || request.status === 'In Progress' || isLogDetailsDialogOpen && targetStatusOnSubmitForLogging === 'Completed')) && (
         <LogMechanicDetailsDialog
            isOpen={isLogDetailsDialogOpen}
            onClose={() => setIsLogDetailsDialogOpen(false)}
            request={request}
            onSubmitLog={handleLogSubmit}
            targetStatusOnSubmit={targetStatusOnSubmitForLogging}
         />
      )}
    </>
  );
};

export default RequestCard;

