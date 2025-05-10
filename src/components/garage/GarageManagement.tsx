
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { ServiceProvider } from '@/types';
import { addGarage, updateGarage, deleteGarage, listenToGarages } from '@/services/garageService'; // Uses localStorage
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

const GarageManagement = () => {
  const [garages, setGarages] = useState<ServiceProvider[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGarage, setEditingGarage] = useState<ServiceProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    // listenToGarages now uses localStorage and will call back with initial data
    // and on 'storage' events if data changes in another tab (for the same browser).
    const unsubscribe = listenToGarages((garagesData) => {
      setGarages(garagesData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddGarage = () => {
    setEditingGarage(null);
    setIsDialogOpen(true);
  };

  const handleEditGarage = (garage: ServiceProvider) => {
    setEditingGarage(garage);
    setIsDialogOpen(true);
  };

  const handleDeleteGarage = async (garageId: string) => {
    try {
      await deleteGarage(garageId); // Deletes from localStorage
      toast({ title: "Garage Deleted (Local)", description: "The garage provider has been removed from local storage." });
    } catch (error) {
      console.error("Error deleting garage from localStorage:", error);
      toast({ title: "Deletion Failed (Local)", description: "Could not delete garage provider from local storage.", variant: "destructive" });
    }
  };

  const handleSaveGarage = async (garageData: ServiceProvider) => {
    const { id, distanceKm, ...dataToSave } = garageData; 

    try {
      if (editingGarage && id) { 
        await updateGarage(id, dataToSave); // Updates localStorage
      } else { 
        await addGarage(dataToSave as Omit<ServiceProvider, 'id' | 'distanceKm'>); // Adds to localStorage
      }
      setIsDialogOpen(false);
      setEditingGarage(null);
      toast({ title: `Garage ${editingGarage ? 'Updated' : 'Added'} (Local)`, description: `${garageData.name} has been successfully ${editingGarage ? 'updated' : 'added'} to local storage.` });
    } catch (error) {
       console.error("Error saving garage to localStorage:", error);
       toast({ title: "Save Failed (Local)", description: "Could not save garage details to local storage.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center"><Globe className="mr-2 h-5 w-5 text-primary" /> Manage Garage Providers (Local)</CardTitle>
                <CardDescription>Loading local garage data...</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-6">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Fetching local garage list...</p>
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
              <CardTitle className="text-xl flex items-center"><Globe className="mr-2 h-5 w-5 text-primary" /> Manage Garage Providers (Local)</CardTitle>
              <CardDescription>Add, edit, or remove service provider branches. Data is stored in this browser.</CardDescription>
            </div>
            <Button onClick={handleAddGarage}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Garage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {garages.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No garage providers added yet in local storage. Default mock list may be active.</p>
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
                        <Button variant="ghost" size="icon" onClick={() => handleEditGarage(garage)} className="mr-2">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete {garage.name} from the local provider list.
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
