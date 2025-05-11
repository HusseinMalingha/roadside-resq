
"use client";

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, XSquare } from 'lucide-react';

interface CancelRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}

const CANCELLATION_REASONS = [
  "Issue resolved itself",
  "Found alternative help",
  "Provider taking too long",
  "Accidental request",
  "Other",
];

const CancelRequestDialog: React.FC<CancelRequestDialogProps> = ({ isOpen, onClose, onSubmit }) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const finalReason = selectedReason === "Other" ? otherReason : selectedReason;
    if (!finalReason.trim()) {
        alert("Please provide a reason for cancellation."); // Simple validation, use toast in real app
        setIsSubmitting(false);
        return;
    }
    await onSubmit(finalReason);
    setIsSubmitting(false);
    // onClose will be called by parent upon successful submission or if user closes manually
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <XSquare className="mr-2 h-5 w-5 text-destructive" />
            Request Service Cancellation
          </DialogTitle>
          <DialogDescription>
            Please select a reason for cancelling your service request. This will be sent to the provider.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="cancellationReason">Reason for Cancellation</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger id="cancellationReason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedReason === "Other" && (
            <div className="space-y-1.5">
              <Label htmlFor="otherReasonDetails">Please specify</Label>
              <Textarea
                id="otherReasonDetails"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Enter details for your cancellation..."
                rows={3}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Close
            </Button>
          </DialogClose>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isSubmitting || !selectedReason || (selectedReason === "Other" && !otherReason.trim())}
            variant="destructive"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit Cancellation Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelRequestDialog;
