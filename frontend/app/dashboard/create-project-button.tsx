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
        className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all font-semibold h-9 px-4 py-1.5"
      >
        <Plus className="h-4 w-4" />
        Create Project
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

