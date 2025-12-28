import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';

// Force dynamic rendering to avoid Clerk key requirement during build
export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await currentUser();

  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/sign-in');
  }
}
