
// src/components/garage/LogMechanicDetailsDialog.tsx
"use client";

import { useEffect } from 'react';
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

const logDetailsSchema = z.object({
  mechanicNotes: z.string().optional(),
  resourcesUsed: z.string().optional(),
});

type LogDetailsFormData = z.infer<typeof logDetailsSchema>;

interface LogMechanicDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest;
  onSubmitLog: (mechanicNotes: string, resourcesUsed: string, newStatus: ServiceRequest['status']) => void;
  targetStatusOnSubmit: ServiceRequest['status']; // The status this logging action will result in
}

const LogMechanicDetailsDialog: React.FC<LogMechanicDetailsDialogProps> = ({
  isOpen,
  onClose,
  request,
  onSubmitLog,
  targetStatusOnSubmit,
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LogDetailsFormData>({
    resolver: zodResolver(logDetailsSchema),
    defaultValues: {
      mechanicNotes: request.mechanicNotes || '',
      resourcesUsed: request.resourcesUsed || '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        mechanicNotes: request.mechanicNotes || '',
        resourcesUsed: request.resourcesUsed || '',
      });
    }
  }, [isOpen, request, reset]);

  const handleFormSubmit = (data: LogDetailsFormData) => {
    onSubmitLog(data.mechanicNotes || '', data.resourcesUsed || '', targetStatusOnSubmit);
  };
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Details for Request: {request.requestId}</DialogTitle>
          <DialogDescription>
            {targetStatusOnSubmit === 'Completed' 
              ? `Finalize details to complete this request. Status will be set to: ${targetStatusOnSubmit}.`
              : `Update notes and resources for this request. Current Status: ${request.status}.`}
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
          
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">
              {targetStatusOnSubmit === 'Completed' ? 'Complete Request & Save' : 'Save Details'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LogMechanicDetailsDialog;
