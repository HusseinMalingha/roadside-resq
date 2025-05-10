
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { VehicleInfo } from '@/types';
import { CarIcon, Check } from 'lucide-react';

interface VehicleInfoFormProps {
  onVehicleInfoSubmit: (info: VehicleInfo) => void;
  initialData?: Partial<VehicleInfo>;
  isSubmitted: boolean;
}

const VehicleInfoForm: FC<VehicleInfoFormProps> = ({ onVehicleInfoSubmit, initialData, isSubmitted }) => {
  const [make, setMake] = useState(initialData?.make || '');
  const [model, setModel] = useState(initialData?.model || '');
  const [year, setYear] = useState(initialData?.year || '');
  const [licensePlate, setLicensePlate] = useState(initialData?.licensePlate || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (make.trim() && model.trim() && year.trim() && licensePlate.trim()) {
      onVehicleInfoSubmit({ make, model, year, licensePlate });
    }
  };

  const canConfirm = make.trim() && model.trim() && year.trim() && licensePlate.trim();

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="text-xl">3. Vehicle Information</CardTitle>
        <CardDescription>Please provide your vehicle details.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vehicleMake">Make (e.g., Toyota)</Label>
              <Input
                id="vehicleMake"
                placeholder="Toyota"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                required
                className="text-base"
                disabled={isSubmitted}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicleModel">Model (e.g., Camry)</Label>
              <Input
                id="vehicleModel"
                placeholder="Camry"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className="text-base"
                disabled={isSubmitted}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vehicleYear">Year (e.g., 2018)</Label>
              <Input
                id="vehicleYear"
                type="text" // Changed to text to allow flexibility, can add pattern for numbers
                placeholder="2018"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
                className="text-base"
                disabled={isSubmitted}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="licensePlate">License Plate (e.g., UAB 123X)</Label>
              <Input
                id="licensePlate"
                placeholder="UAB 123X"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                required
                className="text-base"
                disabled={isSubmitted}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!canConfirm || isSubmitted}
          >
            {isSubmitted ? <Check className="mr-2 h-4 w-4" /> : <CarIcon className="mr-2 h-4 w-4" />}
            {isSubmitted ? 'Vehicle Info Confirmed' : 'Confirm Vehicle Info'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default VehicleInfoForm;
