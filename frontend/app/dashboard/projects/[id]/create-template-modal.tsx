'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface CreateTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

export function CreateTemplateModal({
  open,
  onOpenChange,
  projectId,
  projectName,
}: CreateTemplateModalProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(`${projectName} (Clone)`);
  const [includeStatuses, setIncludeStatuses] = useState(true);
  const [includeRoles, setIncludeRoles] = useState(true);
  const [includeUsers, setIncludeUsers] = useState(false);
  const [includeTasks, setIncludeTasks] = useState(false);
  const [keepAssignees, setKeepAssignees] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/projects/from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          source_project_id: projectId,
          include_statuses: includeStatuses,
          include_roles: includeRoles,
          include_users: includeUsers,
          include_tasks: includeTasks,
          keep_assignees: keepAssignees,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to clone project');
      }

      const newProject = await response.json();

      // Close modal and navigate to the new project
      onOpenChange(false);
      router.push(`/dashboard/projects/${newProject.project_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setName(`${projectName} (Clone)`);
    setIncludeStatuses(true);
    setIncludeRoles(true);
    setIncludeUsers(false);
    setIncludeTasks(false);
    setKeepAssignees(false);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Clone Project</DialogTitle>
          <DialogDescription>
            Create a copy of &quot;{projectName}&quot; with the options you select.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                New Project Name
              </label>
              <Input
                id="name"
                placeholder="Enter project name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Include in clone:</label>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeStatuses"
                  checked={includeStatuses}
                  onCheckedChange={(checked) => {
                    setIncludeStatuses(checked === true);
                    if (!checked) {
                      setIncludeTasks(false);
                      setKeepAssignees(false);
                    }
                  }}
                  disabled={isLoading}
                />
                <label htmlFor="includeStatuses" className="text-sm cursor-pointer">
                  Statuses
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeRoles"
                  checked={includeRoles}
                  onCheckedChange={(checked) => setIncludeRoles(checked === true)}
                  disabled={isLoading}
                />
                <label htmlFor="includeRoles" className="text-sm cursor-pointer">
                  Roles
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeUsers"
                  checked={includeUsers}
                  onCheckedChange={(checked) => {
                    setIncludeUsers(checked === true);
                    if (!checked) {
                      setKeepAssignees(false);
                    }
                  }}
                  disabled={isLoading}
                />
                <label htmlFor="includeUsers" className="text-sm cursor-pointer">
                  Users
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTasks"
                  checked={includeTasks}
                  onCheckedChange={(checked) => {
                    setIncludeTasks(checked === true);
                    if (!checked) {
                      setKeepAssignees(false);
                    }
                  }}
                  disabled={isLoading || !includeStatuses}
                />
                <label
                  htmlFor="includeTasks"
                  className={`text-sm cursor-pointer ${!includeStatuses ? 'text-muted-foreground' : ''}`}
                >
                  Tasks {!includeStatuses && '(requires statuses)'}
                </label>
              </div>

              {includeTasks && (
                <div className="flex items-center space-x-2 ml-6">
                  <Checkbox
                    id="keepAssignees"
                    checked={keepAssignees}
                    onCheckedChange={(checked) => setKeepAssignees(checked === true)}
                    disabled={isLoading || !includeUsers}
                  />
                  <label
                    htmlFor="keepAssignees"
                    className={`text-sm cursor-pointer ${!includeUsers ? 'text-muted-foreground' : ''}`}
                  >
                    Keep task assignees {!includeUsers && '(requires users)'}
                  </label>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Cloning...' : 'Clone Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
