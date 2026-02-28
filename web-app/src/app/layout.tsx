import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Smart Warehouse System',
  description: 'IoT-driven smart warehouse management system with real-time inventory tracking',
  keywords: ['warehouse', 'inventory', 'IoT', 'smart shelves'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <Toaster 
            position="top-right" 
            expand={true}
            richColors
            closeButton
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
