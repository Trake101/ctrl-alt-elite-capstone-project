'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
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
import { FileText, History, Loader2, MessageSquare, Pencil, Send, Trash2 } from 'lucide-react';
import { getGravatarUrl } from '@/lib/gravatar';

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

interface CommentData {
  comment_id: string;
  task_id: string;
  created_by: string;
  comment: string;
  created_at: string;
  updated_at: string;
  creator_email: string;
  creator_first_name: string | null;
  creator_last_name: string | null;
}

interface ActivityLogData {
  activity_log_id: string;
  action: string;
  description: string;
  action_by: string | null;
  actor_email: string | null;
  actor_first_name: string | null;
  actor_last_name: string | null;
  created_at: string;
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
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
  const { user: clerkUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSwimLaneId, setSelectedSwimLaneId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Comments state
  const [comments, setComments] = useState<CommentData[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Activity log state
  const [activityLogs, setActivityLogs] = useState<ActivityLogData[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  const fetchComments = useCallback(async (taskId: string) => {
    setIsLoadingComments(true);
    try {
      const token = await getToken({ skipCache: true });
      if (!token) return;
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setComments(await res.json());
      }
    } catch {
      // silently fail — comments are non-critical
    } finally {
      setIsLoadingComments(false);
    }
  }, [getToken]);

  const fetchActivity = useCallback(async (taskId: string) => {
    setIsLoadingActivity(true);
    try {
      const token = await getToken({ skipCache: true });
      if (!token) return;
      const res = await fetch(`/api/tasks/${taskId}/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setActivityLogs(await res.json());
      }
    } catch {
      // silently fail
    } finally {
      setIsLoadingActivity(false);
    }
  }, [getToken]);

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setSelectedSwimLaneId(task.project_swim_lane_id);
      setSelectedUserId(task.assigned_to || '');
      setHasChanges(false);
      setError(null);
      setIsEditing(false);
      fetchComments(task.task_id);
      fetchActivity(task.task_id);
    } else {
      setComments([]);
      setActivityLogs([]);
    }
  }, [task, fetchComments, fetchActivity]);

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
      setIsEditing(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setSelectedSwimLaneId(task.project_swim_lane_id);
      setSelectedUserId(task.assigned_to || '');
      setHasChanges(false);
      setError(null);
    }
    setIsEditing(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmitComment = async () => {
    if (!task || !newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      const token = await getToken({ skipCache: true });
      if (!token) return;
      const res = await fetch(`/api/tasks/${task.task_id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: newComment.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        setComments((prev) => [created, ...prev]);
        setNewComment('');
      }
    } catch {
      // ignore
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const token = await getToken({ skipCache: true });
      if (!token) return;
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.comment_id !== commentId));
      }
    } catch {
      // ignore
    }
  };

  // Find current user's DB id from the users prop (matched by clerk id)
  const currentDbUser = users.find((u) => {
    if (!clerkUser) return false;
    // Match by email since we have clerkUser.primaryEmailAddress
    return u.email === clerkUser.primaryEmailAddress?.emailAddress;
  });

  // Helper to get user display name
  const getUserDisplayName = (userId: string | null) => {
    if (!userId) return null;
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    return user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.email;
  };

  // Helper to get user email for gravatar
  const getUserEmail = (userId: string | null) => {
    if (!userId) return null;
    const user = users.find(u => u.id === userId);
    return user?.email || null;
  };

  // Helper to get swim lane name
  const getSwimLaneName = (swimLaneId: string) => {
    const lane = swimLanes.find(l => l.swim_lane_id === swimLaneId);
    return lane?.name || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] max-h-[700px] overflow-hidden content-start">
        <DialogHeader>
          <DialogTitle className="pr-8 truncate">{task.title}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="details" className="w-full">
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

          <TabsContent value="details" className="mt-4 overflow-y-auto max-h-[calc(80vh-12rem)]">
            {isEditing ? (
              // Edit Mode
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
                      Assign to
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

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
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
            ) : (
              // View Mode
              <div className="space-y-6">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                    <p className="text-sm whitespace-pre-wrap">
                      {task.description || <span className="text-muted-foreground italic">No description</span>}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-sm">
                        {getSwimLaneName(task.project_swim_lane_id)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Assigned to</h3>
                      {task.assigned_to ? (
                        <div className="flex items-center gap-2">
                          {getUserEmail(task.assigned_to) && (
                            <img
                              src={getGravatarUrl(getUserEmail(task.assigned_to)!, 24)}
                              alt=""
                              className="w-6 h-6 rounded-full"
                            />
                          )}
                          <span className="text-sm">{getUserDisplayName(task.assigned_to)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Unassigned</span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground pt-4 border-t">
                    <p>Created: {formatDate(task.created_at)}</p>
                    <p>Updated: {formatDate(task.updated_at)}</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="mt-4 flex flex-col overflow-hidden max-h-[calc(80vh-12rem)]">
            {/* Comments list */}
            <div className="flex-1 overflow-y-auto space-y-3">
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No notes yet. Add one below.</p>
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.comment_id} className="flex gap-3 group">
                    <img
                      src={getGravatarUrl(c.creator_email, 32)}
                      alt=""
                      className="w-8 h-8 rounded-full mt-0.5 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {c.creator_first_name && c.creator_last_name
                            ? `${c.creator_first_name} ${c.creator_last_name}`
                            : c.creator_email}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatTimeAgo(c.created_at)}
                        </span>
                        {currentDbUser && c.created_by === currentDbUser.id && (
                          <button
                            onClick={() => handleDeleteComment(c.comment_id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{c.comment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment input */}
            <div className="flex gap-2 pt-3 border-t mt-3">
              <Textarea
                placeholder="Add a note..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmittingComment}
                rows={2}
                className="resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSubmitComment();
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmittingComment}
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4 overflow-y-auto max-h-[calc(80vh-12rem)]">
            {isLoadingActivity ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <History className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              </div>
            ) : (
              <div className="relative pl-6">
                {/* Timeline line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                <div className="space-y-4">
                  {activityLogs.map((log) => {
                    const actorName = log.actor_first_name && log.actor_last_name
                      ? `${log.actor_first_name} ${log.actor_last_name}`
                      : log.actor_email || 'Unknown';
                    return (
                      <div key={log.activity_log_id} className="relative flex gap-3">
                        {/* Timeline dot */}
                        <div className="absolute -left-6 top-1.5 h-2 w-2 rounded-full bg-muted-foreground/40" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className="font-medium">{actorName}</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {log.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatTimeAgo(log.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
