'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, History, MessageSquare } from 'lucide-react';

interface SwimLane {
  swim_lane_id: string;
  name: string;
  order: number;
}

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface Task {
  task_id: string;
  project_id: string;
  project_swim_lane_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  swimLanes: SwimLane[];
  users: User[];
  onSuccess?: () => void;
}

export function TaskDetailModal({
  open,
  onOpenChange,
  task,
  swimLanes,
  users,
  onSuccess,
}: TaskDetailModalProps) {
  const { getToken } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSwimLaneId, setSelectedSwimLaneId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setSelectedSwimLaneId(task.project_swim_lane_id);
      setSelectedUserId(task.assigned_to || '');
      setHasChanges(false);
      setError(null);
    }
  }, [task]);

  // Track changes
  useEffect(() => {
    if (task) {
      const titleChanged = title !== task.title;
      const descChanged = description !== (task.description || '');
      const laneChanged = selectedSwimLaneId !== task.project_swim_lane_id;
      const userChanged = selectedUserId !== (task.assigned_to || '');
      setHasChanges(titleChanged || descChanged || laneChanged || userChanged);
    }
  }, [title, description, selectedSwimLaneId, selectedUserId, task]);

  const handleSave = async () => {
    if (!task) return;

    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    if (!selectedSwimLaneId) {
      setError('Please select a status');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken({ skipCache: true });

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`/api/tasks/${task.task_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          project_swim_lane_id: selectedSwimLaneId,
          assigned_to: selectedUserId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to update task');
      }

      setHasChanges(false);
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

  const handleClose = () => {
    onOpenChange(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="pr-8 truncate">{task.title}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="details" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" className="gap-2">
              <FileText className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <div className="grid gap-2">
                <label htmlFor="task-title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="task-title"
                  placeholder="Enter task title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="task-description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="task-description"
                  placeholder="Enter task description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="task-status" className="text-sm font-medium">
                    Status
                  </label>
                  <select
                    id="task-status"
                    value={selectedSwimLaneId}
                    onChange={(e) => setSelectedSwimLaneId(e.target.value)}
                    disabled={isLoading}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Select a status</option>
                    {swimLanes.map((lane) => (
                      <option key={lane.swim_lane_id} value={lane.swim_lane_id}>
                        {lane.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="task-assignee" className="text-sm font-medium">
                    Assignee
                  </label>
                  <select
                    id="task-assignee"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    disabled={isLoading}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Unassigned</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs text-muted-foreground pt-4 border-t">
                <p>Created: {formatDate(task.created_at)}</p>
                <p>Updated: {formatDate(task.updated_at)}</p>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading || !hasChanges}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-4 flex-1 overflow-y-auto">
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add notes and comments to this task to keep track of discussions and decisions.
              </p>
              <p className="text-xs text-muted-foreground">
                Coming soon
              </p>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4 flex-1 overflow-y-auto">
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <History className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-2">History</h3>
              <p className="text-sm text-muted-foreground mb-4">
                View the complete history of changes made to this task.
              </p>
              <p className="text-xs text-muted-foreground">
                Coming soon
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
