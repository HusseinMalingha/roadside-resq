
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { ServiceProvider } from '@/types';
import { getGaragesFromStorage, saveGaragesToStorage } from '@/lib/localStorageUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Globe, MapPin, Phone, Layers } from 'lucide-react';
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
  const { toast } = useToast();

  const loadGarages = useCallback(() => {
    const storedGarages = getGaragesFromStorage();
    setGarages(storedGarages);
  }, []);

  useEffect(() => {
    loadGarages();
  }, [loadGarages]);

  const handleAddGarage = () => {
    setEditingGarage(null);
    setIsDialogOpen(true);
  };

  const handleEditGarage = (garage: ServiceProvider) => {
    setEditingGarage(garage);
    setIsDialogOpen(true);
  };

  const handleDeleteGarage = (garageId: string) => {
    const updatedGarages = garages.filter(g => g.id !== garageId);
    saveGaragesToStorage(updatedGarages);
    setGarages(updatedGarages);
    toast({ title: "Garage Deleted", description: "The garage provider has been removed." });
  };

  const handleSaveGarage = (garage: ServiceProvider) => {
    let updatedGarageList;
    if (editingGarage) { 
      updatedGarageList = garages.map(g => g.id === garage.id ? garage : g);
    } else { 
      updatedGarageList = [...garages, garage];
    }
    saveGaragesToStorage(updatedGarageList);
    setGarages(updatedGarageList);
    setIsDialogOpen(false);
    setEditingGarage(null);
    toast({ title: `Garage ${editingGarage ? 'Updated' : 'Added'}`, description: `${garage.name} has been successfully ${editingGarage ? 'updated' : 'added'}.` });
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center"><Globe className="mr-2 h-5 w-5 text-primary" /> Manage Garage Providers</CardTitle>
              <CardDescription>Add, edit, or remove service provider branches.</CardDescription>
            </div>
            <Button onClick={handleAddGarage}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Garage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {garages.length === 0 ? (
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
                      <TableCell>{garage.servicesOffered.length}</TableCell>
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
