import Link from 'next/link';
import { LifeBuoy } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-primary text-primary-foreground shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3 text-2xl font-bold tracking-tight hover:opacity-90 transition-opacity">
          <LifeBuoy className="h-8 w-8" />
          <span>Roadside Rescue</span>
        </Link>
        {/* Future navigation items can be added here */}
      </div>
    </header>
  );
};

export default Header;
