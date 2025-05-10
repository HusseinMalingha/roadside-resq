
// src/components/garage/RequestList.tsx
"use client";

import type { FC } from 'react';
import type { ServiceRequest } from '@/types';
import RequestCard from './RequestCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Inbox } from 'lucide-react';

interface RequestListProps {
  requests: ServiceRequest[];
  onStatusChange: (requestId: string, newStatus: ServiceRequest['status']) => void;
}

const RequestList: FC<RequestListProps> = ({ requests, onStatusChange }) => {
  if (requests.length === 0) {
    return (
      <Alert className="mt-6">
        <Inbox className="h-5 w-5" />
        <AlertTitle>No Active Requests</AlertTitle>
        <AlertDescription>
          There are currently no service requests matching your filters.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ScrollArea className="h-full w-full pr-3"> {/* Changed height to h-full */}
      <div className="space-y-4">
        {requests.map((request) => (
          <RequestCard key={request.id} request={request} onStatusChange={onStatusChange} />
        ))}
      </div>
    </ScrollArea>
  );
};

export default RequestList;

    