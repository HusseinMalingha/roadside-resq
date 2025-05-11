
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { ServiceProvider } from '@/types';
import { addGarage, updateGarage, deleteGarage, listenToGarages } from '@/services/garageService'; 
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Globe, MapPin, Phone, Layers, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddEditGarageDialog from './AddEditGarageDialog'; 
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

const GarageManagement = () => {
  const [garages, setGarages] = useState<ServiceProvider[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGarage, setEditingGarage] = useState<ServiceProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { isFirebaseReady } = useAuth();

  useEffect(() => {
    if (!isFirebaseReady) {
      setIsLoading(false); // Firestore not ready, stop loading
      return;
    }
    setIsLoading(true);
    const unsubscribe = listenToGarages((garagesData) => {
      setGarages(garagesData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [isFirebaseReady]);

  const handleAddGarage = () => {
    if (!isFirebaseReady) {
      toast({ title: "Service Unavailable", description: "Cannot add garage, database not connected.", variant: "destructive"});
      return;
    }
    setEditingGarage(null);
    setIsDialogOpen(true);
  };

  const handleEditGarage = (garage: ServiceProvider) => {
    if (!isFirebaseReady) {
      toast({ title: "Service Unavailable", description: "Cannot edit garage, database not connected.", variant: "destructive"});
      return;
    }
    setEditingGarage(garage);
    setIsDialogOpen(true);
  };

  const handleDeleteGarage = async (garageId: string) => {
    if (!isFirebaseReady) {
      toast({ title: "Service Unavailable", description: "Cannot delete garage, database not connected.", variant: "destructive"});
      return;
    }
    try {
      await deleteGarage(garageId); 
      toast({ title: "Garage Deleted", description: "The garage provider has been removed." });
    } catch (error) {
      console.error("Error deleting garage:", error);
      toast({ title: "Deletion Failed", description: "Could not delete garage provider.", variant: "destructive" });
    }
  };

  const handleSaveGarage = async (garageData: Omit<ServiceProvider, 'id' | 'distanceKm'> & { id?: string }) => {
    if (!isFirebaseReady) {
      toast({ title: "Service Unavailable", description: "Cannot save garage, database not connected.", variant: "destructive"});
      return;
    }
    // Remove id if it's for a new garage, Firestore will generate one
    const { id, ...dataToSave } = garageData; 

    try {
      if (editingGarage && editingGarage.id) { 
        await updateGarage(editingGarage.id, dataToSave); 
      } else { 
        await addGarage(dataToSave); 
      }
      setIsDialogOpen(false);
      setEditingGarage(null);
      toast({ title: `Garage ${editingGarage ? 'Updated' : 'Added'}`, description: `${garageData.name} has been successfully ${editingGarage ? 'updated' : 'added'}.` });
    } catch (error) {
       console.error("Error saving garage:", error);
       toast({ title: "Save Failed", description: "Could not save garage details.", variant: "destructive" });
    }
  };

  if (isLoading && isFirebaseReady) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><Globe className="mr-2 h-5 w-5 text-primary" /> Manage Garage Providers</CardTitle>
                <CardDescription>Loading garage data...</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-6">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Fetching garage list...</p>
            </CardContent>
        </Card>
    );
  }

  if (!isFirebaseReady) {
     return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><Globe className="mr-2 h-5 w-5 text-primary" /> Manage Garage Providers</CardTitle>
                <CardDescription className="text-destructive">Database service not available. Garages cannot be managed.</CardDescription>
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
              <CardTitle className="text-xl flex items-center"><Globe className="mr-2 h-5 w-5 text-primary" /> Manage Garage Providers</CardTitle>
              <CardDescription>Add, edit, or remove service provider branches.</CardDescription>
            </div>
            <Button onClick={handleAddGarage} disabled={!isFirebaseReady}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Garage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {garages.length === 0 && !isLoading ? (
            <p className="text-muted-foreground text-center py-4">No garage providers added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead><Phone className="inline-block mr-1 h-4 w-4" />Phone</TableHead>
                    <TableHead><MapPin className="inline-block mr-1 h-4 w-4" />Location</TableHead>
                    <TableHead><Layers className="inline-block mr-1 h-4 w-4" />Services (Count)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {garages.map((garage) => (
                    <TableRow key={garage.id}>
                      <TableCell className="font-medium">{garage.name}</TableCell>
                      <TableCell>{garage.phone}</TableCell>
                      <TableCell>{garage.generalLocation} <span className="text-xs text-muted-foreground">({garage.currentLocation.lat.toFixed(2)}, {garage.currentLocation.lng.toFixed(2)})</span></TableCell>
                      <TableCell>{Array.isArray(garage.servicesOffered) ? garage.servicesOffered.length : 0}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditGarage(garage)} className="mr-2" disabled={!isFirebaseReady}>
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
                                This action cannot be undone. This will permanently delete {garage.name} from the provider list.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteGarage(garage.id)} className="bg-destructive hover:bg-destructive/90">
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
      <AddEditGarageDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setEditingGarage(null); }}
        onSave={handleSaveGarage}
        existingGarage={editingGarage}
      />
    </>
  );
};

export default GarageManagement;
