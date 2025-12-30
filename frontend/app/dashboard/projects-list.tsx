'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Loader2, CalendarIcon, MoreVertical } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Project {
  project_id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken({ skipCache: true });
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data);
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
                <MoreVertical className="size-5 text-muted-foreground" />
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

