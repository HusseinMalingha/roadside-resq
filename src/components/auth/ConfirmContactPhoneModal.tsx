
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserContactPhoneNumber } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Phone, Loader2 } from 'lucide-react';

const ConfirmContactPhoneModal = () => {
  const { requiresPhoneModalInfo, setRequiresPhoneModalInfo, refreshUserProfile } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (requiresPhoneModalInfo?.show) {
      setPhoneNumber(requiresPhoneModalInfo.initialPhoneNumber || '');
    }
  }, [requiresPhoneModalInfo]);

  const handleConfirm = async () => {
    if (!requiresPhoneModalInfo || !requiresPhoneModalInfo.userId) return;
    if (!phoneNumber.trim()) {
        toast({ title: "Phone Number Required", description: "Please enter a valid phone number.", variant: "destructive"});
        return;
    }
    // Basic E.164 validation (very simplified, consider a library for production)
    if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
        toast({ title: "Invalid Format", description: "Please enter phone in international format (e.g., +16505551234).", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    try {
      await updateUserContactPhoneNumber(requiresPhoneModalInfo.userId, phoneNumber, true);
      await refreshUserProfile();
      toast({ title: "Contact Phone Confirmed", description: "Your contact phone number has been updated." });
      setRequiresPhoneModalInfo(null); // Close modal
    } catch (error) {
      console.error("Error confirming phone number:", error);
      toast({ title: "Update Failed", description: "Could not save your phone number.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUseDifferentNumber = () => {
    setPhoneNumber(''); // Clear if they want to enter a new one
  };

  if (!requiresPhoneModalInfo?.show) {
    return null;
  }

  return (
    <Dialog open={requiresPhoneModalInfo.show} onOpenChange={(open) => { if(!open) setRequiresPhoneModalInfo(null);}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()} hideCloseButton={true}>
        <DialogHeader>
          <DialogTitle>Confirm Your Contact Phone</DialogTitle>
          <DialogDescription>
            Please confirm or provide the phone number you'd like to be contacted on for service updates.
            This will be stored in your ResQ profile.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {requiresPhoneModalInfo.initialPhoneNumber && phoneNumber === requiresPhoneModalInfo.initialPhoneNumber && (
            <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                    Your Google account provided this phone number: <strong>{requiresPhoneModalInfo.initialPhoneNumber}</strong>.
                </p>
                <Button onClick={handleConfirm} className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                    Yes, use this number
                </Button>
                <Button variant="outline" onClick={handleUseDifferentNumber} className="w-full" disabled={isSubmitting}>
                    Enter a different number
                </Button>
            </div>
          )}
          
          {(!requiresPhoneModalInfo.initialPhoneNumber || phoneNumber !== requiresPhoneModalInfo.initialPhoneNumber) && (
            <div className="space-y-1.5">
                <Label htmlFor="phoneNumber">Phone Number (e.g., +16505551234)</Label>
                <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your contact phone number"
                />
            </div>
          )}
        </div>
        {(!requiresPhoneModalInfo.initialPhoneNumber || phoneNumber !== requiresPhoneModalInfo.initialPhoneNumber) && (
            <DialogFooter>
                <Button onClick={() => setRequiresPhoneModalInfo(null)} variant="outline" disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button onClick={handleConfirm} disabled={isSubmitting || !phoneNumber.trim()}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                    Confirm Phone Number
                </Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Helper for DialogContent to optionally hide close button
declare module '@radix-ui/react-dialog' {
  interface DialogContentProps {
    hideCloseButton?: boolean;
  }
}
// Modify DialogContent in ui/dialog.tsx if not already done
// Ensure X button is conditionally rendered if hideCloseButton is true
// For now, this modal will not have the X, user must use buttons.

export default ConfirmContactPhoneModal;
