'use client';

import { UserButton } from '@clerk/nextjs';
import { Logo } from '@/components/logo';

export function Navbar() {
  return (
    <header className="bg-navbar text-navbar-foreground sticky left-0 top-0 shadow-md z-50">
      <div className="px-4 flex justify-between items-center h-[48px] relative">
        <div className="flex items-center space-x-4">
          <Logo theme="dark" />
        </div>
        <div className="flex items-center">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
    </header>
  );
}

