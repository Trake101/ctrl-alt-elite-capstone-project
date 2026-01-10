'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Navbar } from '@/components/ui/navbar';
import { UserSync } from '../../user-sync';
import { Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectSettingsModal } from './project-settings-modal';
interface Project {
  project_id: string;
  name: string;
  owner_id: string;
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  let taskCount: number = 1;
  const swimLaneNames: string[] = ["Backlog", "To Do", "Done"]
  return (
    <div className="min-h-screen bg-background">
      <UserSync />
      <Navbar />
      <main className="container mx-auto px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">{project.name}</h1>
          <Button
            variant="default"
            className="gap-2"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
          <div className = "flex gap-[20px]">
          {swimLaneNames.map((lane, index) => (
          <div className="card border-2 bg-gray-100 shadow-lg border-gray-400 rounded-lg w-[300px] h-[750px] p-3">
              <p className="font-bold text-xl">{lane}</p>
              <div className="space-y-3">
              {Array.from({length: 3}).map((_, index) => (
              <div className= "card border bg-white border-gray-400 rounded-lg shadow-lg w-[270px] h-[60px]">
                  <p className="font-sans text-center">Example Task {taskCount++}</p>
              </div>
              ))}
              </div>
          </div>
          ))}
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
      />
    </div>
  );
}