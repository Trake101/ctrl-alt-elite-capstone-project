'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface UserSyncProps {
  onSyncComplete?: () => void;
}

export function UserSync({ onSyncComplete }: UserSyncProps) {
  const { user, isLoaded } = useUser();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!isLoaded || !user) return;

    const syncUser = async () => {
      try {
        setSyncStatus('syncing');
        
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clerk_id: user.id,
            email: user.emailAddresses[0]?.emailAddress || '',
            first_name: user.firstName || null,
            last_name: user.lastName || null,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to sync user');
        }

        setSyncStatus('success');
        if (onSyncComplete) {
          onSyncComplete();
        }
      } catch (error) {
        console.error('Error syncing user:', error);
        setSyncStatus('error');
      }
    };

    syncUser();
  }, [user, isLoaded, onSyncComplete]);

  // This component doesn't render anything visible
  return null;
}

