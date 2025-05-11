
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { UserProfile } from '@/types';
import { updateUserProfile } from '@/services/userService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, UserCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).max(50).optional().or(z.literal('')),
  contactPhoneNumber: z.string().regex(/^(\+?[1-9]\d{1,14}|)$/, { message: "Invalid phone number format. Use E.164 format (e.g., +16505551234) or leave empty." }).optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface EditProfileFormProps {
  userProfile: UserProfile;
  onProfileUpdate: () => Promise<void>; // Callback to refresh profile in AuthContext
}

const EditProfileForm: FC<EditProfileFormProps> = ({ userProfile, onProfileUpdate }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: userProfile.displayName || '',
      contactPhoneNumber: userProfile.contactPhoneNumber || userProfile.phoneNumber || '', // Prioritize contactPhoneNumber
    },
  });

  useEffect(() => {
    reset({
      displayName: userProfile.displayName || '',
      contactPhoneNumber: userProfile.contactPhoneNumber || userProfile.phoneNumber || '',
    });
  }, [userProfile, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const updateData: Partial<UserProfile> = {};
      if (data.displayName !== undefined) updateData.displayName = data.displayName || null; // Set to null if empty string
      if (data.contactPhoneNumber !== undefined) updateData.contactPhoneNumber = data.contactPhoneNumber || null; // Set to null if empty string
      
      await updateUserProfile(userProfile.uid, updateData);
      await onProfileUpdate(); // Refresh context
      toast({
        title: "Profile Updated",
        description: "Your personal details have been saved.",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Update Failed",
        description: "Could not save your profile changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
            <UserCircle2 className="mr-2 h-6 w-6 text-primary" />
            Personal Information
        </CardTitle>
        <CardDescription>Update your display name and contact phone number.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              {...register("displayName")}
              placeholder="Your Name"
              className={errors.displayName ? "border-destructive" : ""}
            />
            {errors.displayName && <p className="text-xs text-destructive mt-1">{errors.displayName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactPhoneNumber">Contact Phone Number</Label>
            <Input
              id="contactPhoneNumber"
              type="tel"
              {...register("contactPhoneNumber")}
              placeholder="e.g., +16505551234 (optional)"
              className={errors.contactPhoneNumber ? "border-destructive" : ""}
            />
            {errors.contactPhoneNumber && <p className="text-xs text-destructive mt-1">{errors.contactPhoneNumber.message}</p>}
            <p className="text-xs text-muted-foreground">
              This number will be used for service-related communication if provided.
              Your Firebase authenticated phone number is: {userProfile.phoneNumber || "Not set"}.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting || !isDirty} className="w-full sm:w-auto">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Personal Info
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EditProfileForm;
