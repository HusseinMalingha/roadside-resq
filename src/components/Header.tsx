import Link from 'next/link';
import { LifeBuoy, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Header = () => {
  return (
    <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3 text-2xl font-bold tracking-tight hover:opacity-90 transition-opacity">
          <LifeBuoy className="h-8 w-8" />
          <span>Roadside Rescue</span>
        </Link>
        <nav>
          <Link href="/garage-admin" legacyBehavior passHref>
            <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
              <Wrench className="mr-2 h-5 w-5" />
              Garage Admin
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
