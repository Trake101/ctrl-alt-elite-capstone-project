'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface Project {
  project_id: number;
  name: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
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
      {projects.map((project) => (
        <div
          key={project.project_id}
          onClick={() => router.push(`/dashboard/projects/${project.project_id}`)}
          className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
          <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
          <p className="text-sm text-muted-foreground">
            Created {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}

