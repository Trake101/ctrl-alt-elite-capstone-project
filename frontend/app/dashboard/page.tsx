import { currentUser } from '@clerk/nextjs/server';
import { UserSync } from './user-sync';
import { Navbar } from '@/components/ui/navbar';
import { CreateProjectButton } from './create-project-button';
import { ProjectsList } from './projects-list';

// Force dynamic rendering to avoid Clerk key requirement during build
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <div className="min-h-screen bg-background">
      <UserSync />
      <Navbar />
      <main className="container mx-auto px-6 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-foreground">My Projects</h1>
          <CreateProjectButton />
        </div>

        <ProjectsList />
      </main>
    </div>
  );
}

