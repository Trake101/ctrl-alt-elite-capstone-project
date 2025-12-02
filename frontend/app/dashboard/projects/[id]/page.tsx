'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Navbar } from '@/components/ui/navbar';
import { UserSync } from '../../user-sync';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Project {
  project_id: number;
  name: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = await getToken({ skipCache: true });
        
        if (!token) {
          throw new Error('No authentication token available');
        }

        const response = await fetch(`/api/projects/${projectId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || 'Failed to fetch project');
        }

        const data = await response.json();
        setProject(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId, getToken]);

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

  return (
    <div className="min-h-screen bg-background">
      <UserSync />
      <Navbar />
      <main className="container mx-auto px-6 py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="mb-6">
          <h1 className="text-4xl font-bold">{project.name}</h1>
        </div>

        {/* Content area - will be added later */}
        <div className="bg-card border rounded-lg p-6">
          <p className="text-muted-foreground">Project content will be added here.</p>
        </div>
      </main>
    </div>
  );
}

