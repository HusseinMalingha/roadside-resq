
// src/components/garage/AssignStaffDialog.tsx
"use client";

import { useState, useEffect } from 'react';
import type { StaffMember } from '@/types';
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
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users } from 'lucide-react';

interface AssignStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  currentAssignedStaffId?: string | null;
  availableMechanics: StaffMember[]; // This list should be pre-filtered to *assignable* mechanics by the parent
  allMechanics: StaffMember[]; // Full list of all mechanics for looking up names
  onAssignStaff: (requestId: string, staffId: string | null) => void;
}

const AssignStaffDialog: React.FC<AssignStaffDialogProps> = ({
  isOpen,
  onClose,
  requestId,
  currentAssignedStaffId,
  availableMechanics, 
  allMechanics,
  onAssignStaff,
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(currentAssignedStaffId || null);

  useEffect(() => {
    setSelectedStaffId(currentAssignedStaffId || null);
  }, [currentAssignedStaffId, isOpen]);

  const handleSave = () => {
    onAssignStaff(requestId, selectedStaffId);
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Mechanic</DialogTitle>
          <DialogDescription>Select an available mechanic to assign to this service request.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {availableMechanics.length === 0 && !currentAssignedStaffId && (
            <Alert variant="default">
              <Users className="h-4 w-4" />
              <AlertTitle>No Mechanics Available</AlertTitle>
              <AlertDescription>
                There are currently no mechanics available for assignment (they might all be occupied). 
                You can still unassign if needed.
              </AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="mechanic" className="text-right">
              Mechanic
            </Label>
            <div className="col-span-3">
              <Select
                value={selectedStaffId || ""}
                onValueChange={(value) => setSelectedStaffId(value === "unassign" ? null : value)}
              >
                <SelectTrigger id="mechanic">
                  <SelectValue placeholder="Select a mechanic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassign">Unassign</SelectItem>
                  {availableMechanics.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} ({staff.email})
                    </SelectItem>
                  ))}
                  {/* If current assigned mechanic is not in the filtered available list, show them as an option too for context */}
                  {currentAssignedStaffId && !availableMechanics.find(s => s.id === currentAssignedStaffId) && 
                    (() => {
                        // Look up in allMechanics list
                        const currentMechanic = allMechanics.find(s => s.id === currentAssignedStaffId);
                        return currentMechanic ? (
                            <SelectItem key={currentMechanic.id} value={currentMechanic.id} disabled>
                                {currentMechanic.name} (Currently Assigned, Occupied)
                            </SelectItem>
                        ) : null;
                    })()
                  }
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={availableMechanics.length === 0 && !selectedStaffId && !currentAssignedStaffId}>
            Confirm Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignStaffDialog;
