
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

interface AssignStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  currentAssignedStaffId?: string | null;
  staffList: StaffMember[]; // Should be pre-filtered to mechanics
  onAssignStaff: (requestId: string, staffId: string | null) => void;
}

const AssignStaffDialog: React.FC<AssignStaffDialogProps> = ({
  isOpen,
  onClose,
  requestId,
  currentAssignedStaffId,
  staffList,
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
          <DialogDescription>Select a mechanic to assign to this service request.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} ({staff.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>Confirm Assignment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignStaffDialog;
