
"use client";

import { useEffect } from 'react';
import type { ServiceProvider } from '@/types';
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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Globe } from 'lucide-react';

const garageSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Garage name must be at least 3 characters."),
  phone: z.string().regex(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4,6})$/, "Invalid phone number format."),
  generalLocation: z.string().min(3, "General location is required."),
  servicesOffered: z.string().min(1, "At least one service must be listed (comma-separated)."),
  lat: z.coerce.number().min(-90).max(90, "Latitude must be between -90 and 90."),
  lng: z.coerce.number().min(-180).max(180, "Longitude must be between -180 and 180."),
  etaMinutes: z.coerce.number().int().min(0, "ETA must be a positive number.").optional().default(30), // Default ETA
});

type GarageFormData = z.infer<typeof garageSchema>;

interface AddEditGarageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (garage: ServiceProvider) => void;
  existingGarage?: ServiceProvider | null;
}

const AddEditGarageDialog: React.FC<AddEditGarageDialogProps> = ({ isOpen, onClose, onSave, existingGarage }) => {
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<GarageFormData>({
    resolver: zodResolver(garageSchema),
    defaultValues: existingGarage 
      ? { 
          ...existingGarage, 
          servicesOffered: Array.isArray(existingGarage.servicesOffered) ? existingGarage.servicesOffered.join(', ') : '',
          lat: existingGarage.currentLocation.lat,
          lng: existingGarage.currentLocation.lng,
        }
      : { name: '', phone: '', generalLocation: '', servicesOffered: '', lat: 0, lng: 0, etaMinutes: 30 },
  });

  useEffect(() => {
    if (isOpen) {
      if (existingGarage) {
        reset({
          ...existingGarage,
          servicesOffered: Array.isArray(existingGarage.servicesOffered) ? existingGarage.servicesOffered.join(', ') : '',
          lat: existingGarage.currentLocation.lat,
          lng: existingGarage.currentLocation.lng,
        });
      } else {
        reset({ id: undefined, name: '', phone: '', generalLocation: '', servicesOffered: '', lat: 0, lng: 0, etaMinutes: 30 });
      }
    }
  }, [existingGarage, reset, isOpen]);

  const onSubmit = (data: GarageFormData) => {
    const servicesArray = data.servicesOffered.split(',').map(s => s.trim()).filter(s => s);
    onSave({
      id: existingGarage?.id || `garage-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
      name: data.name,
      phone: data.phone,
      generalLocation: data.generalLocation,
      servicesOffered: servicesArray,
      currentLocation: { lat: data.lat, lng: data.lng },
      etaMinutes: data.etaMinutes || 30, // Ensure etaMinutes has a value
      isCustom: true, // Mark as custom added/edited
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Globe className="mr-2 h-5 w-5" /> 
            {existingGarage ? 'Edit Garage Provider' : 'Add New Garage Provider'}
          </DialogTitle>
          <DialogDescription>
            {existingGarage ? 'Update the details for this garage.' : 'Enter the details for the new garage provider.'}
            <br />
            <span className="text-xs text-muted-foreground">Tip: For accurate location, use Google Maps to find coordinates (Latitude, Longitude). Future updates may allow direct map searching.</span>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Garage Name</Label>
            <Input id="name" {...register("name")} className={errors.name ? "border-destructive" : ""} placeholder="e.g., Auto Xpress Downtown" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" {...register("phone")} className={errors.phone ? "border-destructive" : ""} placeholder="(256) 7XX-XXXXXX" />
            {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="generalLocation">General Location / Address</Label>
            <Input id="generalLocation" {...register("generalLocation")} className={errors.generalLocation ? "border-destructive" : ""} placeholder="e.g., Kampala Central, Plot 123 Main St" />
            {errors.generalLocation && <p className="text-xs text-destructive mt-1">{errors.generalLocation.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <Label htmlFor="lat">Latitude</Label>
                <Input id="lat" type="number" step="any" {...register("lat")} className={errors.lat ? "border-destructive" : ""} placeholder="e.g., 0.3136" />
                {errors.lat && <p className="text-xs text-destructive mt-1">{errors.lat.message}</p>}
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="lng">Longitude</Label>
                <Input id="lng" type="number" step="any" {...register("lng")} className={errors.lng ? "border-destructive" : ""} placeholder="e.g., 32.5811" />
                {errors.lng && <p className="text-xs text-destructive mt-1">{errors.lng.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="servicesOffered">Services Offered (comma-separated)</Label>
            <Textarea id="servicesOffered" {...register("servicesOffered")} className={errors.servicesOffered ? "border-destructive" : ""} placeholder="e.g., Tire Repair, Oil Change, Battery Jumpstart" rows={3}/>
            {errors.servicesOffered && <p className="text-xs text-destructive mt-1">{errors.servicesOffered.message}</p>}
          </div>
           <div className="space-y-1.5">
            <Label htmlFor="etaMinutes">Default ETA (minutes)</Label>
            <Input id="etaMinutes" type="number" {...register("etaMinutes")} className={errors.etaMinutes ? "border-destructive" : ""} placeholder="e.g., 30"/>
            {errors.etaMinutes && <p className="text-xs text-destructive mt-1">{errors.etaMinutes.message}</p>}
          </div>

          <DialogFooter className="mt-2 sticky bottom-0 bg-background py-3">
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Garage</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditGarageDialog;
