import { SignUp } from '@clerk/nextjs';

// Force dynamic rendering to avoid Clerk key requirement during build
export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '24px'
    }}>
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
          }
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/dashboard"
      />
    </div>
  );
}

