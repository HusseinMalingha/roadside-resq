
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'ResQ',
  description: 'Get help fast when you need it most.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen flex flex-col">
        <AuthProvider>
          <Header />
          <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col">
            {children}
          </main>
          <Toaster />
          <footer className="py-6 text-center text-sm text-muted-foreground border-t">
            © {new Date().getFullYear()} ResQ. All rights reserved.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
