
"use client";

import { useState, useEffect } from 'react';
import type { ServiceRequest } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, MessageCircleWarning } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RespondToCancellationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  request: ServiceRequest;
  onSubmit: (approved: boolean, responseNotes?: string) => void;
}

const RespondToCancellationDialog: React.FC<RespondToCancellationDialogProps> = ({
  isOpen,
  onClose,
  request,
  onSubmit,
}) => {
  const [responseNotes, setResponseNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setResponseNotes(''); // Reset notes when dialog opens
    }
  }, [isOpen]);

  const handleSubmit = async (approved: boolean) => {
    setIsSubmitting(true);
    await onSubmit(approved, responseNotes);
    setIsSubmitting(false);
    // onClose will be called by parent or if user closes manually
  };
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) onClose();}}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageCircleWarning className="mr-2 h-5 w-5 text-orange-500" />
            Respond to Cancellation Request
          </DialogTitle>
          <DialogDescription>
            User has requested to cancel service request ID: {request.requestId}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <Alert variant="default" className="bg-orange-50 border-orange-300">
                <AlertTitle className="font-semibold">User's Reason for Cancellation:</AlertTitle>
                <AlertDescription className="italic">
                    "{request.cancellationReason || "No reason provided by user."}"
                </AlertDescription>
            </Alert>
          <div className="space-y-1.5">
            <Label htmlFor="responseNotes">Response Notes (Optional)</Label>
            <Textarea
              id="responseNotes"
              value={responseNotes}
              onChange={(e) => setResponseNotes(e.target.value)}
              placeholder="e.g., Cancellation approved due to..., or Denied because..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            type="button" 
            variant="destructive"
            onClick={() => handleSubmit(true)} 
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Approve Cancellation
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => handleSubmit(false)} 
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
            Deny Cancellation
          </Button>
           <DialogClose asChild>
            <Button type="button" variant="ghost" disabled={isSubmitting} className="w-full sm:w-auto sm:ml-auto">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RespondToCancellationDialog;
