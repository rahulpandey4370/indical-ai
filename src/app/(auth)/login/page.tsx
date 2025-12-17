'use client';

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  User,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M21.35 11.1h-9.1v3.8h5.4c-.2 1.2-1.2 3-3.2 3-2.3 0-4.2-1.9-4.2-4.2s1.9-4.2 4.2-4.2c1.1 0 2.1.4 2.8 1.1l2.3-2.3C18.2 5.2 16 4 13.5 4 8.2 4 4 8.2 4 13.5s4.2 9.5 9.5 9.5c5.1 0 9.2-4 9.2-9.2 0-.6-.1-1.2-.3-1.7z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const auth = getAuth();

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    router.push('/');
    return <LoadingSpinner />;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-8">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome to IndiCal AI</CardTitle>
                    <CardDescription>
                        Sign in to start tracking your nutrition journey.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" onClick={signIn}>
                        <GoogleIcon />
                        Sign in with Google
                    </Button>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
