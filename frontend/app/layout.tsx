import { ClerkProvider } from '@clerk/nextjs';
import { Inter as FontSans } from 'next/font/google';
import { cn } from '@/lib/utils';
import './globals.css';

const fontSans = FontSans({ 
  subsets: ['latin'], 
  variable: '--font-sans' 
});

// Force dynamic rendering to avoid Clerk key requirement during build
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Only use ClerkProvider if publishable key is available (runtime check)
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    // During build or if key is missing, render without Clerk
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
          {children}
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
