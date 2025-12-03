'use client';

import { UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const router = useRouter();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 
              onClick={() => router.push('/dashboard')}
              className="text-xl font-semibold cursor-pointer hover:opacity-80 transition-opacity"
            >
              Task Board
            </h1>
          </div>
          <div className="flex items-center">
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </div>
    </nav>
  );
}

