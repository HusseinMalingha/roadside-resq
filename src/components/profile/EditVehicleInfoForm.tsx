
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UserProfile, VehicleInfo } from '@/types';
import { updateUserVehicleInfo } from '@/services/userService'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, CarIcon, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const vehicleInfoSchema = z.object({
  make: z.string().min(1, "Make is required.").max(50).optional().or(z.literal('')),
  model: z.string().min(1, "Model is required.").max(50).optional().or(z.literal('')),
  year: z.string()
    .regex(/^(\d{4}|)$/, "Year must be 4 digits or empty.")
    .optional().or(z.literal('')),
  licensePlate: z.string().min(1, "License plate is required.").max(15).optional().or(z.literal('')),
});

type VehicleFormData = z.infer<typeof vehicleInfoSchema>;

interface EditVehicleInfoFormProps {
  userProfile: UserProfile;
  onVehicleInfoUpdate: () => Promise<void>;
}

const EditVehicleInfoForm: FC<EditVehicleInfoFormProps> = ({ userProfile, onVehicleInfoUpdate }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isDirty }, setValue } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleInfoSchema),
    defaultValues: userProfile.vehicleInfo || { make: '', model: '', year: '', licensePlate: '' },
  });

  useEffect(() => {
    reset(userProfile.vehicleInfo || { make: '', model: '', year: '', licensePlate: '' });
  }, [userProfile, reset]);

  const onSubmit = async (data: VehicleFormData) => {
    setIsSubmitting(true);
    // If all fields are empty, treat it as removing vehicle info
    const allEmpty = !data.make && !data.model && !data.year && !data.licensePlate;
    
    if (!allEmpty) {
        // Basic validation: if one field is filled, make and model become required.
        if ( (data.make || data.model || data.year || data.licensePlate) && (!data.make || !data.model || !data.licensePlate)) {
             toast({
                title: "Incomplete Vehicle Info",
                description: "If providing vehicle details, Make, Model, and License Plate are required.",
                variant: "destructive",
            });
            setIsSubmitting(false);
            return;
        }
    }

    const vehicleDataToSave: VehicleInfo | null = allEmpty ? null : {
      make: data.make || '',
      model: data.model || '',
      year: data.year || '',
      licensePlate: data.licensePlate || '',
    };

    try {
      await updateUserVehicleInfo(userProfile.uid, vehicleDataToSave);
      await onVehicleInfoUpdate();
      toast({
        title: "Vehicle Info Updated",
        description: allEmpty ? "Your default vehicle information has been cleared." : "Your default vehicle information has been saved.",
      });
    } catch (error) {
      console.error("Failed to update vehicle info:", error);
      toast({
        title: "Update Failed",
        description: "Could not save your vehicle changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClearVehicleInfo = async () => {
     setIsSubmitting(true);
     try {
      await updateUserVehicleInfo(userProfile.uid, null);
      reset({ make: '', model: '', year: '', licensePlate: '' }); // Clear form fields
      await onVehicleInfoUpdate();
      toast({
        title: "Vehicle Info Cleared",
        description: "Your default vehicle information has been removed.",
      });
    } catch (error) {
      console.error("Failed to clear vehicle info:", error);
      toast({
        title: "Clear Failed",
        description: "Could not clear vehicle information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
            <CarIcon className="mr-2 h-6 w-6 text-primary" />
            Default Vehicle Information
        </CardTitle>
        <CardDescription>Manage your default vehicle. This can speed up service requests.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vehicleMake">Make (e.g., Toyota)</Label>
              <Input id="vehicleMake" {...register("make")} placeholder="Toyota" className={errors.make ? "border-destructive" : ""} />
              {errors.make && <p className="text-xs text-destructive mt-1">{errors.make.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicleModel">Model (e.g., Camry)</Label>
              <Input id="vehicleModel" {...register("model")} placeholder="Camry" className={errors.model ? "border-destructive" : ""} />
              {errors.model && <p className="text-xs text-destructive mt-1">{errors.model.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vehicleYear">Year (e.g., 2018)</Label>
              <Input id="vehicleYear" type="text" {...register("year")} placeholder="2018" className={errors.year ? "border-destructive" : ""} />
              {errors.year && <p className="text-xs text-destructive mt-1">{errors.year.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="licensePlate">License Plate (e.g., UAB 123X)</Label>
              <Input id="licensePlate" {...register("licensePlate")} placeholder="UAB 123X" className={errors.licensePlate ? "border-destructive" : ""} />
              {errors.licensePlate && <p className="text-xs text-destructive mt-1">{errors.licensePlate.message}</p>}
            </div>
          </div>
           <p className="text-xs text-muted-foreground">
              Leave all fields blank to clear your default vehicle information.
            </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <Button type="submit" disabled={isSubmitting || !isDirty} className="w-full sm:w-auto">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Vehicle Info
          </Button>
          {userProfile.vehicleInfo && (
             <Button type="button" variant="outline" onClick={handleClearVehicleInfo} disabled={isSubmitting} className="w-full sm:w-auto text-destructive hover:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" /> Clear Vehicle Info
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
};

export default EditVehicleInfoForm;
