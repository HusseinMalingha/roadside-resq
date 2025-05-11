
// src/app/profile/page.tsx
import { Suspense } from 'react';
import ProfileClientPage from './profile-client-page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UserCircle } from 'lucide-react';

export const metadata = {
  title: 'My Profile - ResQ',
  description: 'Manage your ResQ profile information.',
};

function ProfilePageSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4 md:px-0">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl flex items-center">
            <UserCircle className="mr-3 h-7 w-7 text-primary" />
            My Profile
          </CardTitle>
          <CardDescription>Loading your profile details...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">Fetching Profile</p>
            <p className="text-sm text-muted-foreground mt-1">Please wait a moment.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePageContainer() {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfileClientPage />
    </Suspense>
  );
}
