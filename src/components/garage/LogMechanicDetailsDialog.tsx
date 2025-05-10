
// src/components/garage/LogMechanicDetailsDialog.tsx
"use client";

import { useEffect, useState } from 'react';
import type { ServiceRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const logDetailsSchema = z.object({
  mechanicNotes: z.string().optional(),
  resourcesUsed: z.string().optional(),
  newStatus: z.enum(['Accepted', 'In Progress', 'Completed', 'Cancelled']).optional(),
});

type LogDetailsFormData = z.infer<typeof logDetailsSchema>;

interface LogMechanicDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest;
  onSubmit: (mechanicNotes: string, resourcesUsed: string, newStatus?: ServiceRequest['status']) => void;
}

const LogMechanicDetailsDialog: React.FC<LogMechanicDetailsDialogProps> = ({
  isOpen,
  onClose,
  request,
  onSubmit,
}) => {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<LogDetailsFormData>({
    resolver: zodResolver(logDetailsSchema),
    defaultValues: {
      mechanicNotes: request.mechanicNotes || '',
      resourcesUsed: request.resourcesUsed || '',
      newStatus: request.status === 'Accepted' ? 'In Progress' : (request.status === 'In Progress' ? 'Completed' : undefined)
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        mechanicNotes: request.mechanicNotes || '',
        resourcesUsed: request.resourcesUsed || '',
        newStatus: request.status === 'Accepted' ? 'In Progress' : (request.status === 'In Progress' ? 'Completed' : request.status) // Default next logical status
      });
    }
  }, [isOpen, request, reset]);

  const handleFormSubmit = (data: LogDetailsFormData) => {
    onSubmit(data.mechanicNotes || '', data.resourcesUsed || '', data.newStatus as ServiceRequest['status'] | undefined);
  };
  
  if (!isOpen) return null;

  const statusOptionsForMechanic: ServiceRequest['status'][] = [];
  if (request.status === 'Accepted') {
    statusOptionsForMechanic.push('In Progress', 'Cancelled');
  } else if (request.status === 'In Progress') {
    statusOptionsForMechanic.push('Completed', 'Cancelled');
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Details for Request: {request.requestId}</DialogTitle>
          <DialogDescription>
            Update notes, resources used, and optionally the status for this service request. Current Status: {request.status}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="mechanicNotes">Mechanic Notes</Label>
            <Textarea
              id="mechanicNotes"
              {...register("mechanicNotes")}
              placeholder="e.g., Replaced battery, checked alternator."
              rows={3}
            />
            {errors.mechanicNotes && <p className="text-xs text-destructive mt-1">{errors.mechanicNotes.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="resourcesUsed">Resources Used</Label>
            <Input
              id="resourcesUsed"
              {...register("resourcesUsed")}
              placeholder="e.g., 1x Battery Model XYZ, 30 mins labor."
            />
            {errors.resourcesUsed && <p className="text-xs text-destructive mt-1">{errors.resourcesUsed.message}</p>}
          </div>
          
          {(request.status === 'Accepted' || request.status === 'In Progress') && (
            <div className="space-y-1.5">
              <Label htmlFor="newStatus">Update Status to (Optional)</Label>
               <Controller
                name="newStatus"
                control={control}
                defaultValue={request.status} 
                render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || request.status}>
                        <SelectTrigger id="newStatus">
                            <SelectValue placeholder="Select new status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={request.status}>Keep Current ({request.status})</SelectItem>
                            {statusOptionsForMechanic.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
            {errors.newStatus && <p className="text-xs text-destructive mt-1">{errors.newStatus.message}</p>}
            </div>
          )}


          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Details</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LogMechanicDetailsDialog;
