'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface SaveTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

export function SaveTemplateModal({
  open,
  onOpenChange,
  projectId,
  projectName,
}: SaveTemplateModalProps) {
  const { getToken } = useAuth();
  const [name, setName] = useState(`${projectName} Template`);
  const [description, setDescription] = useState('');
  const [includeStatuses, setIncludeStatuses] = useState(true);
  const [includeRoles, setIncludeRoles] = useState(true);
  const [includeUsers, setIncludeUsers] = useState(false);
  const [includeTasks, setIncludeTasks] = useState(false);
  const [keepAssignees, setKeepAssignees] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/templates/from-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
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
        throw new Error(errorData.detail || 'Failed to save template');
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setName(`${projectName} Template`);
    setDescription('');
    setIncludeStatuses(true);
    setIncludeRoles(true);
    setIncludeUsers(false);
    setIncludeTasks(false);
    setKeepAssignees(false);
    setError(null);
    setSuccess(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save &quot;{projectName}&quot; as a reusable template.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Template Name
              </label>
              <Input
                id="name"
                placeholder="Enter template name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                disabled={isLoading || success}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (optional)
              </label>
              <Textarea
                id="description"
                placeholder="Describe what this template is for"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading || success}
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Include in template:</label>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeStatuses"
                  checked={includeStatuses}
                  onCheckedChange={(checked) => {
                    setIncludeStatuses(checked === true);
                    if (!checked) {
                      setIncludeTasks(false);
                    }
                  }}
                  disabled={isLoading || success}
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
                  disabled={isLoading || success}
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
                  disabled={isLoading || success}
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
                  disabled={isLoading || success || !includeStatuses}
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
                    disabled={isLoading || success || !includeUsers}
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

            {success && (
              <p className="text-sm text-green-600">Template saved successfully!</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              {success ? 'Close' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={isLoading || success}>
              {isLoading ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
