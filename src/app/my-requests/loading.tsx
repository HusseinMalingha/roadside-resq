
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ListChecks, Loader2 } from 'lucide-react';

export default function MyRequestsLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 md:px-0">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-2xl md:text-3xl flex items-center">
                <ListChecks className="mr-3 h-7 w-7 text-primary" />
                My Service Requests
              </CardTitle>
              <CardDescription>Loading your assistance request history...</CardDescription>
            </div>
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">Fetching Your Requests</p>
            <p className="text-sm text-muted-foreground mt-1">Please wait a moment.</p>
          </div>
          <div className="space-y-4 p-1 mt-4">
            {[1, 2].map((i) => (
              <Card key={i} className="shadow-md">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-6 w-3/4 rounded" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-1/2 rounded mt-1" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-5/6 rounded" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t">
                     <Skeleton className="h-4 w-3/4 rounded" />
                     <Skeleton className="h-4 w-3/4 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
