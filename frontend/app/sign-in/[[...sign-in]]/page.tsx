import { SignIn } from '@clerk/nextjs';

// Force dynamic rendering to avoid Clerk key requirement during build
export const dynamic = 'force-dynamic';

export default function SignInPage() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '24px'
    }}>
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
          }
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
      />
    </div>
  );
}

