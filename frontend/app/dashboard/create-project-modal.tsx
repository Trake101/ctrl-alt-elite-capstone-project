'use client';

import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';

interface TemplateTask {
  title: string;
  assigned_to: string | null;
}

interface Template {
  template_id: string;
  name: string;
  description: string | null;
  tasks: TemplateTask[] | null;
}

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateProjectModalProps) {
  const { getToken } = useAuth();
  const [projectName, setProjectName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [keepAssignees, setKeepAssignees] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if selected template has tasks with assignees
  const selectedTemplate = templates.find(t => t.template_id === selectedTemplateId);
  const templateHasAssignees = selectedTemplate?.tasks?.some(task => task.assigned_to) ?? false;

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const token = await getToken({ skipCache: true });
      if (!token) return;

      const response = await fetch('/api/templates', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get a fresh token, skipping cache to ensure we have a valid token
      const token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      let response;

      if (selectedTemplateId) {
        // Create from template
        response = await fetch('/api/templates/create-project', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: projectName.trim(),
            template_id: selectedTemplateId,
            keep_assignees: keepAssignees,
          }),
        });
      } else {
        // Create blank project
        response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: projectName.trim(),
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create project');
      }

      // Reset form and close modal
      setProjectName('');
      setSelectedTemplateId('');
      setKeepAssignees(false);
      setError(null);
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter a name for your new project. You can change this later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Project Name
              </label>
              <Input
                id="name"
                placeholder="My Awesome Project"
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  setError(null);
                }}
                disabled={isLoading}
                className={error ? 'border-destructive' : ''}
              />
            </div>

            {templates.length > 0 && (
              <div className="grid gap-2">
                <label htmlFor="template" className="text-sm font-medium">
                  Template (optional)
                </label>
                <select
                  id="template"
                  value={selectedTemplateId}
                  onChange={(e) => {
                    setSelectedTemplateId(e.target.value);
                    setKeepAssignees(false);
                  }}
                  disabled={isLoading || isLoadingTemplates}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Start from scratch</option>
                  {templates.map((template) => (
                    <option key={template.template_id} value={template.template_id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                {selectedTemplateId && selectedTemplate?.description && (
                  <p className="text-xs text-muted-foreground">
                    {selectedTemplate.description}
                  </p>
                )}
                {templateHasAssignees && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id="keepAssignees"
                      checked={keepAssignees}
                      onCheckedChange={(checked) => setKeepAssignees(checked === true)}
                      disabled={isLoading}
                    />
                    <label htmlFor="keepAssignees" className="text-sm cursor-pointer">
                      Keep task assignees from template
                    </label>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setProjectName('');
                setSelectedTemplateId('');
                setKeepAssignees(false);
                setError(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

