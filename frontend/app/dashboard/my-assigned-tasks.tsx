'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Loader2, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MyTask {
  task_id: string;
  project_id: string;
  project_name: string;
  project_swim_lane_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
}

export function MyAssignedTasks() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const token = await getToken({ skipCache: true });
      if (!token) return;

      const response = await fetch('/api/tasks/assigned-to-me', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) return;

      const data = await response.json();
      setTasks(data);
    } catch {
      // Silently fail — this section is non-critical
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <CheckSquare className="size-5" />
          My Assigned Tasks
        </h2>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <CheckSquare className="size-5" />
        My Assigned Tasks
        <Badge variant="secondary" className="ml-1">{tasks.length}</Badge>
      </h2>
      <div className="space-y-1">
        {tasks.map((task) => (
          <div
            key={task.task_id}
            onClick={() => router.push(`/dashboard/projects/${task.project_id}`)}
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-medium text-sm truncate">{task.title}</span>
              <Badge variant="outline" className="text-xs shrink-0">{task.project_name}</Badge>
            </div>
            <span className="text-xs text-muted-foreground shrink-0 ml-3">
              {formatDistanceToNow(new Date(task.updated_at))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
