
// src/components/garage/StaffManagement.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { StaffMember, StaffRole } from '@/types';
import { addStaffMember, updateStaffMember, deleteStaffMember, listenToStaffMembers } from '@/services/staffService'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Users, Briefcase, WrenchIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddEditStaffDialog from './AddEditStaffDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/contexts/AuthContext'; // For isFirebaseReady check

const StaffManagement = () => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { isFirebaseReady } = useAuth();

  useEffect(() => {
    if (!isFirebaseReady) {
      setIsLoading(false); // Firestore not ready, stop loading
      return;
    }
    setIsLoading(true);
    const unsubscribe = listenToStaffMembers((staff) => {
      setStaffMembers(staff);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [isFirebaseReady]);

  const handleAddStaff = () => {
    if (!isFirebaseReady) {
      toast({ title: "Service Unavailable", description: "Cannot add staff, database not connected.", variant: "destructive"});
      return;
    }
    setEditingStaff(null);
    setIsDialogOpen(true);
  };

  const handleEditStaff = (staff: StaffMember) => {
     if (!isFirebaseReady) {
      toast({ title: "Service Unavailable", description: "Cannot edit staff, database not connected.", variant: "destructive"});
      return;
    }
    setEditingStaff(staff);
    setIsDialogOpen(true);
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!isFirebaseReady) {
      toast({ title: "Service Unavailable", description: "Cannot delete staff, database not connected.", variant: "destructive"});
      return;
    }
    try {
      await deleteStaffMember(staffId); 
      toast({ title: "Staff Member Deleted", description: "The staff member has been removed." });
    } catch (error) {
      console.error("Error deleting staff member:", error);
      toast({ title: "Deletion Failed", description: "Could not delete staff member.", variant: "destructive" });
    }
  };

  const handleSaveStaff = async (staffData: Omit<StaffMember, 'id'> & { id?: string }) => {
     if (!isFirebaseReady) {
      toast({ title: "Service Unavailable", description: "Cannot save staff, database not connected.", variant: "destructive"});
      return;
    }
    try {
      if (editingStaff && editingStaff.id) {
        await updateStaffMember(editingStaff.id, staffData); 
      } else {
        // Firestore addStaffMember expects Omit<StaffMember, 'id'>
        const { id, ...dataToSave } = staffData;
        await addStaffMember(dataToSave); 
      }
      setIsDialogOpen(false);
      setEditingStaff(null);
      toast({ title: `Staff Member ${editingStaff ? 'Updated' : 'Added'}`, description: `${staffData.name} has been successfully ${editingStaff ? 'updated' : 'added'}.` });
    } catch (error) {
      console.error("Error saving staff member:", error);
      toast({ title: "Save Failed", description: "Could not save staff member details.", variant: "destructive" });
    }
  };
  
  const RoleIcon = ({role}: {role: StaffRole}) => {
    if (role === 'mechanic') return <WrenchIcon className="h-4 w-4 text-blue-500" />;
    if (role === 'customer_relations') return <Briefcase className="h-4 w-4 text-green-500" />;
    if (role === 'admin') return <Users className="h-4 w-4 text-purple-500" />; // Admin icon
    return null;
  }

  if (isLoading && isFirebaseReady) {
      return (
          <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><Users className="mr-2 h-5 w-5 text-primary" /> Manage Staff Members</CardTitle>
                <CardDescription>Loading staff data...</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-6">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                   <p className="mt-2 text-muted-foreground">Fetching staff list...</p>
              </CardContent>
          </Card>
      );
  }
  
  if (!isFirebaseReady) {
     return (
          <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center"><Users className="mr-2 h-5 w-5 text-primary" /> Manage Staff Members</CardTitle>
                <CardDescription className="text-destructive">Database service not available. Staff cannot be managed.</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-6">
                   <p className="mt-2 text-muted-foreground">Please check configuration.</p>
              </CardContent>
          </Card>
      );
  }


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center"><Users className="mr-2 h-5 w-5 text-primary" /> Manage Staff Members</CardTitle>
              <CardDescription>Add, edit, or remove staff.</CardDescription>
            </div>
            <Button onClick={handleAddStaff} disabled={!isFirebaseReady}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {staffMembers.length === 0 && !isLoading ? (
            <p className="text-muted-foreground text-center py-4">No staff members added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffMembers.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell className="font-medium">{staff.name}</TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell className="capitalize flex items-center gap-2">
                        <RoleIcon role={staff.role} />
                        {staff.role.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditStaff(staff)} className="mr-2" disabled={!isFirebaseReady}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={!isFirebaseReady}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete {staff.name} from the staff list.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteStaff(staff.id)} className="bg-destructive hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <AddEditStaffDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setEditingStaff(null); }}
        onSave={handleSaveStaff}
        existingStaff={editingStaff}
      />
    </>
  );
};

export default StaffManagement;
