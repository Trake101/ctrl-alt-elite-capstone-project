'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateProjectModal } from './create-project-modal';

export function CreateProjectButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="default"
        className="gap-1.5 rounded-md font-medium h-9 px-4"
      >
        <Plus className="h-4 w-4" />
        Add Project
      </Button>
      <CreateProjectModal
        open={isOpen}
        onOpenChange={setIsOpen}
        onSuccess={() => {
          // Dispatch event to refresh projects list
          window.dispatchEvent(new Event('projectCreated'));
        }}
      />
    </>
  );
}

