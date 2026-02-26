'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Loader2, CalendarIcon, MoreVertical, Copy, Trash2, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { getGravatarUrl } from '@/lib/gravatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Project {
  project_id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface DashboardMember {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface SwimLaneTaskCount {
  name: string;
  order: number;
  count: number;
}

interface ProjectStats {
  project_id: string;
  task_count: number;
  member_count: number;
  members: DashboardMember[];
  task_breakdown: SwimLaneTaskCount[];
}

const LANE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

export function ProjectsList() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, ProjectStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clone modal state
  const [cloneProject, setCloneProject] = useState<Project | null>(null);
  const [cloneName, setCloneName] = useState('');
  const [includeStatuses, setIncludeStatuses] = useState(true);
  const [includeRoles, setIncludeRoles] = useState(true);
  const [includeUsers, setIncludeUsers] = useState(false);
  const [includeTasks, setIncludeTasks] = useState(false);
  const [keepAssignees, setKeepAssignees] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);

  // Delete modal state
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken({ skipCache: true });
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const headers = { 'Authorization': `Bearer ${token}` };

      const [projectsRes, statsRes] = await Promise.all([
        fetch('/api/projects', { method: 'GET', headers }),
        fetch('/api/dashboard/stats', { method: 'GET', headers }),
      ]);

      if (!projectsRes.ok) {
        const errorData = await projectsRes.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch projects');
      }

      const data = await projectsRes.json();
      setProjects(data);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        const map: Record<string, ProjectStats> = {};
        for (const s of statsData.projects) {
          map[s.project_id] = s;
        }
        setStatsMap(map);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchProjects();

    // Listen for project creation events
    const handleProjectCreated = () => {
      fetchProjects();
    };

    window.addEventListener('projectCreated', handleProjectCreated);
    return () => {
      window.removeEventListener('projectCreated', handleProjectCreated);
    };
  }, [fetchProjects]);

  const resetCloneState = () => {
    setCloneProject(null);
    setCloneName('');
    setIncludeStatuses(true);
    setIncludeRoles(true);
    setIncludeUsers(false);
    setIncludeTasks(false);
    setKeepAssignees(false);
    setCloneError(null);
  };

  const handleClone = async () => {
    if (!cloneProject || !cloneName.trim()) return;

    setIsCloning(true);
    setCloneError(null);

    try {
      const token = await getToken({ skipCache: true });
      if (!token) throw new Error('No authentication token available');

      const response = await fetch('/api/projects/from-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: cloneName.trim(),
          source_project_id: cloneProject.project_id,
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

      resetCloneState();
      fetchProjects();
    } catch (err) {
      setCloneError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCloning(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProject || deleteConfirmText !== deleteProject.name) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const token = await getToken({ skipCache: true });
      if (!token) throw new Error('No authentication token available');

      const response = await fetch(`/api/projects/${deleteProject.project_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to delete project');
      }

      setDeleteProject(null);
      setDeleteConfirmText('');
      fetchProjects();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Error: {error}</p>
        <button
          onClick={fetchProjects}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No projects yet. Create your first project to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => {
        const updatedDate = new Date(project.updated_at);
        const lastUpdatedFromNow = formatDistanceToNow(updatedDate);
        const lastUpdatedAt = updatedDate.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const stats = statsMap[project.project_id];

        return (
          <Card
            key={project.project_id}
            className="hover:shadow-md transition-shadow"
          >
            <CardHeader className="items-start flex-col gap-y-2 gap-x-4 sm:flex-row">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold">
                  {project.name}
                </CardTitle>
              </div>
              <div className="flex flex-wrap items-start justify-end text-sm text-muted-foreground gap-1">
                <span className="flex items-center">
                  <CalendarIcon className="size-3.5 mr-1" /> Last Updated:
                </span>
                <span
                  className={cn(
                    "border-b border-dashed border-muted-foreground cursor-help"
                  )}
                  title={lastUpdatedAt}
                >
                  {lastUpdatedFromNow}
                </span>
              </div>
            </CardHeader>
            {stats && (
              <CardContent className="pt-0 pb-3 space-y-2">
                {/* Progress bar */}
                {stats.task_count > 0 && stats.task_breakdown?.length > 0 && (
                  <TooltipProvider delayDuration={0}>
                    <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                      {stats.task_breakdown
                        .filter((lane) => lane.count > 0)
                        .map((lane) => (
                          <Tooltip key={lane.name}>
                            <TooltipTrigger asChild>
                              <div
                                style={{
                                  width: `${(lane.count / stats.task_count) * 100}%`,
                                  backgroundColor: LANE_COLORS[lane.order % LANE_COLORS.length],
                                }}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              {lane.name}: {lane.count}
                            </TooltipContent>
                          </Tooltip>
                        ))}
                    </div>
                  </TooltipProvider>
                )}
                {/* Task count + members row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      {stats.task_count} {stats.task_count === 1 ? 'task' : 'tasks'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="size-3" />
                      {stats.member_count}
                    </span>
                  </div>
                  {stats.members.length > 0 && (
                    <div className="flex -space-x-2">
                      {stats.members.slice(0, 3).map((member) => (
                        <img
                          key={member.user_id}
                          src={getGravatarUrl(member.email, 28)}
                          alt={member.first_name || member.email}
                          width={28}
                          height={28}
                          className="rounded-full border-2 border-card"
                          title={
                            member.first_name && member.last_name
                              ? `${member.first_name} ${member.last_name}`
                              : member.email
                          }
                        />
                      ))}
                      {stats.member_count > 3 && (
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-medium border-2 border-card">
                          +{stats.member_count - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
            <CardFooter>
              <div className="flex gap-x-2 items-center justify-between w-full">
                <div className="space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => router.push(`/dashboard/projects/${project.project_id}`)}
                  >
                    Open Project
                  </Button>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="size-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setCloneProject(project);
                        setCloneName(`${project.name} (Clone)`);
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Clone
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteProject(project)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardFooter>
          </Card>
        );
      })}

      {/* Clone Project Modal */}
      <Dialog open={!!cloneProject} onOpenChange={(open) => {
        if (!open) resetCloneState();
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Clone Project</DialogTitle>
            <DialogDescription>
              Create a copy of &quot;{cloneProject?.name}&quot; with the options you select.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="cloneName" className="text-sm font-medium">
                New Project Name
              </label>
              <Input
                id="cloneName"
                value={cloneName}
                onChange={(e) => {
                  setCloneName(e.target.value);
                  setCloneError(null);
                }}
                placeholder="Enter project name"
                disabled={isCloning}
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
                  disabled={isCloning}
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
                  disabled={isCloning}
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
                  disabled={isCloning}
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
                  disabled={isCloning || !includeStatuses}
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
                    disabled={isCloning || !includeUsers}
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

            {cloneError && (
              <p className="text-sm text-destructive">{cloneError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetCloneState}
              disabled={isCloning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClone}
              disabled={!cloneName.trim() || isCloning}
            >
              {isCloning ? 'Cloning...' : 'Clone Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Modal */}
      <Dialog open={!!deleteProject} onOpenChange={(open) => {
        if (!open) {
          setDeleteProject(null);
          setDeleteConfirmText('');
          setDeleteError(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the project
              &quot;{deleteProject?.name}&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="deleteConfirm" className="text-sm font-medium">
                Type <span className="font-semibold">{deleteProject?.name}</span> to confirm
              </label>
              <Input
                id="deleteConfirm"
                value={deleteConfirmText}
                onChange={(e) => {
                  setDeleteConfirmText(e.target.value);
                  setDeleteError(null);
                }}
                placeholder="Enter project name to confirm"
                disabled={isDeleting}
              />
            </div>
            {deleteError && (
              <p className="text-sm text-destructive">{deleteError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteProject(null);
                setDeleteConfirmText('');
                setDeleteError(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirmText !== deleteProject?.name || isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

