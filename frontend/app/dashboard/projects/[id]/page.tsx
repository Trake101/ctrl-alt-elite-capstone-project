'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Image from 'next/image';
import { Navbar } from '@/components/ui/navbar';
import { UserSync } from '../../user-sync';
import { Loader2, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectSettingsModal } from './project-settings-modal';
import { CreateTaskModal } from './create-task-modal';
import { TaskDetailModal } from './task-detail-modal';
import { getGravatarUrl } from '@/lib/gravatar';

interface Project {
  project_id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface SwimLane {
  swim_lane_id: string;
  project_id: string;
  name: string;
  order: number;
  created_at: string;
  updated_at: string;
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

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [swimLanes, setSwimLanes] = useState<SwimLane[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [defaultSwimLaneId, setDefaultSwimLaneId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchProjectData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = await getToken({ skipCache: true });

        if (!token) {
          throw new Error('No authentication token available');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
        };

        // Fetch project, swim lanes, tasks, and users in parallel
        const [projectResponse, swimLanesResponse, tasksResponse, usersResponse] = await Promise.all([
          fetch(`/api/projects/${projectId}`, { method: 'GET', headers }),
          fetch(`/api/swim-lanes/project/${projectId}`, { method: 'GET', headers }),
          fetch(`/api/tasks/project/${projectId}`, { method: 'GET', headers }),
          fetch('/api/users', { method: 'GET', headers }),
        ]);

        if (!projectResponse.ok) {
          const errorData = await projectResponse.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Failed to fetch project');
        }

        if (!swimLanesResponse.ok) {
          const errorData = await swimLanesResponse.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Failed to fetch swim lanes');
        }

        if (!tasksResponse.ok) {
          const errorData = await tasksResponse.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Failed to fetch tasks');
        }

        const [projectData, swimLanesData, tasksData] = await Promise.all([
          projectResponse.json(),
          swimLanesResponse.json(),
          tasksResponse.json(),
        ]);

        // Users fetch is optional - don't fail if it doesn't work
        let usersData: User[] = [];
        if (usersResponse.ok) {
          usersData = await usersResponse.json();
        }

        setProject(projectData);
        setSwimLanes(swimLanesData);
        setTasks(tasksData);
        setUsers(usersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProjectData();
    }
  }, [projectId, getToken]);

  const refreshTasks = async () => {
    try {
      const token = await getToken({ skipCache: true });
      if (!token) return;

      const response = await fetch(`/api/tasks/project/${projectId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const tasksData = await response.json();
        setTasks(tasksData);
      }
    } catch (err) {
      console.error('Failed to refresh tasks:', err);
    }
  };

  const refreshSwimLanes = async () => {
    try {
      const token = await getToken({ skipCache: true });
      if (!token) return;

      const response = await fetch(`/api/swim-lanes/project/${projectId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const swimLanesData = await response.json();
        setSwimLanes(swimLanesData);
      }
    } catch (err) {
      console.error('Failed to refresh swim lanes:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <UserSync />
        <Navbar />
        <main className="container mx-auto px-6 py-6">
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading project...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <UserSync />
        <Navbar />
        <main className="container mx-auto px-6 py-6">
          <div className="text-center py-8">
            <p className="text-destructive">Error: {error}</p>
            <Button
              onClick={() => router.push('/dashboard')}
              className="mt-4"
            >
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <UserSync />
        <Navbar />
        <main className="container mx-auto px-6 py-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Project not found</p>
            <Button
              onClick={() => router.push('/dashboard')}
              className="mt-4"
            >
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Helper function to get tasks for a specific swim lane
  const getTasksForLane = (swimLaneId: string) => {
    return tasks.filter(task => task.project_swim_lane_id === swimLaneId);
  };

  // Helper function to get user by ID
  const getUserById = (userId: string | null): User | undefined => {
    if (!userId) return undefined;
    return users.find(user => user.id === userId);
  };

  // Handle task card click
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  // Handle opening create task modal with optional default swim lane
  const openCreateTaskModal = (swimLaneId?: string) => {
    setDefaultSwimLaneId(swimLaneId);
    setIsCreateTaskOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <UserSync />
      <Navbar />
      <main className="container mx-auto px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">{project.name}</h1>
          <div className="flex gap-2">
            <Button
              variant="default"
              className="gap-2"
              onClick={() => openCreateTaskModal(swimLanes[0]?.swim_lane_id)}
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>
        <div className="flex gap-[20px] overflow-x-auto pb-4">
          {swimLanes.map((lane) => (
            <div
              key={lane.swim_lane_id}
              className="card border-2 bg-gray-100 shadow-lg border-gray-400 rounded-lg w-[300px] min-h-[750px] p-3 flex-shrink-0"
            >
              <p className="font-bold text-xl mb-3">{lane.name}</p>
              <div className="space-y-3">
                {getTasksForLane(lane.swim_lane_id).map((task) => {
                  const assignee = getUserById(task.assigned_to);
                  return (
                    <div
                      key={task.task_id}
                      onClick={() => handleTaskClick(task)}
                      className="group bg-background rounded-lg border border-border p-3 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm text-foreground leading-snug flex-1">{task.title}</p>
                        {assignee && (
                          <div className="relative flex-shrink-0" title={assignee.first_name && assignee.last_name
                            ? `${assignee.first_name} ${assignee.last_name}`
                            : assignee.email}>
                            <Image
                              src={getGravatarUrl(assignee.email, 24)}
                              alt={assignee.first_name || assignee.email}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {getTasksForLane(lane.swim_lane_id).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No tasks</p>
                )}
                <button
                  onClick={() => openCreateTaskModal(lane.swim_lane_id)}
                  className="w-full mt-2 py-2 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-background rounded-lg border border-dashed border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </button>
              </div>
            </div>
          ))}
          {swimLanes.length === 0 && (
            <p className="text-muted-foreground">No swim lanes found for this project.</p>
          )}
        </div>
      </main>
      <ProjectSettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        projectId={project.project_id}
        projectName={project.name}
        onProjectUpdate={(newName) => {
          setProject({ ...project, name: newName });
        }}
        onSwimLanesUpdate={refreshSwimLanes}
      />
      <CreateTaskModal
        open={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        projectId={project.project_id}
        swimLanes={swimLanes}
        defaultSwimLaneId={defaultSwimLaneId}
        onSuccess={refreshTasks}
      />
      <TaskDetailModal
        open={isTaskDetailOpen}
        onOpenChange={setIsTaskDetailOpen}
        task={selectedTask}
        swimLanes={swimLanes}
        users={users}
        onSuccess={refreshTasks}
      />
    </div>
  );
}