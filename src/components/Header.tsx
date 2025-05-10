
"use client";

import Link from 'next/link';
import { LifeBuoy, Wrench, LogIn, LogOut, UserCircle, Loader2, AlertCircle } from 'lucide-react'; // Added AlertCircle
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const Header = () => {
  const { user, loading, signOut, isFirebaseReady } = useAuth(); // Added isFirebaseReady

  const getInitials = (name?: string | null) => {
    if (!name) return 'RR';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3 text-2xl font-bold tracking-tight hover:opacity-90 transition-opacity">
          <LifeBuoy className="h-8 w-8" />
          <span>Roadside Rescue</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground">
            <Link href="/garage-admin">
              <Wrench className="mr-2 h-5 w-5" />
              Garage Admin
            </Link>
          </Button>

          {loading ? (
             <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-primary/80">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                    <AvatarFallback>{getInitials(user.displayName || user.email)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.displayName || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email || user.phoneNumber}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer" disabled={!isFirebaseReady}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !isFirebaseReady ? (
             <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="relative flex items-center">
                    <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-not-allowed" disabled>
                      <AlertCircle className="mr-2 h-5 w-5" />
                      Login Unavailable
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Firebase not configured. Auth is offline.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link href="/login">
                <LogIn className="mr-2 h-5 w-5" />
                Login
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
