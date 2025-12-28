import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

// Force dynamic rendering to avoid Clerk key requirement during build
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Only use ClerkProvider if publishable key is available (runtime check)
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    // During build or if key is missing, render without Clerk
    return (
      <html lang="en" className="dark">
        <body className="min-h-screen">
          {children}
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className="min-h-screen">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
