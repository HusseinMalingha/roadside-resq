
// src/components/garage/RequestList.tsx
"use client";

import type { FC } from 'react';
import type { ServiceRequest, StaffMember, UserRole } from '@/types';
import RequestCard from './RequestCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Inbox } from 'lucide-react';

interface RequestListProps {
  requests: ServiceRequest[];
  onStatusChange: (requestId: string, newStatus: ServiceRequest['status'], mechanicNotes?: string, resourcesUsed?: string) => void;
  onAssignStaff?: (requestId: string, staffId: string | null) => void; 
  staffList: StaffMember[]; // Full list of mechanics for display
  assignableStaffList: StaffMember[]; // Filtered list of available mechanics for assignment dialog
  currentUserRole: UserRole;
  currentUserId?: string; 
  currentUserEmail?: string; 
  onRespondToCancellation?: (requestId: string, approved: boolean, responseNotes?: string) => void;
}

const RequestList: FC<RequestListProps> = ({ 
    requests, 
    onStatusChange, 
    onAssignStaff, 
    staffList,
    assignableStaffList, 
    currentUserRole, 
    currentUserId,
    currentUserEmail,
    onRespondToCancellation
}) => {
  if (requests.length === 0) {
    return (
      <Alert className="mt-6">
        <Inbox className="h-5 w-5" />
        <AlertTitle>No Service Requests</AlertTitle>
        <AlertDescription>
          There are currently no service requests matching your filters or assignments.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ScrollArea className="h-full w-full pr-3"> 
      <div className="space-y-4">
        {requests.map((request) => (
          <RequestCard 
            key={request.id} 
            request={request} 
            onStatusChange={onStatusChange} 
            onAssignStaff={onAssignStaff}
            staffList={staffList} 
            assignableStaffList={assignableStaffList} 
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            currentUserEmail={currentUserEmail}
            onRespondToCancellation={onRespondToCancellation}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default RequestList;
