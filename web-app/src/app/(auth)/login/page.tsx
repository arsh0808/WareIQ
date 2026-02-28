'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Warehouse } from 'lucide-react';
import toast from '@/lib/hooks/useToast';

export default function LoginPage() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
      toast.success('Welcome!', 'Successfully signed in with Google');
      router.push('/dashboard');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to sign in with Google';
      toast.error('Google sign in failed', errorMessage);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="max-w-md w-full relative">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mb-4 shadow-lg">
            <Warehouse className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Smart Warehouse
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            IoT Inventory Management System
          </p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center">Sign In with Google</CardTitle>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
              Use your authorized Google account to access the system
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full border-2 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={handleGoogleSignIn}
              isLoading={googleLoading}
              leftIcon={
                !googleLoading && (
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )
              }
            >
              Sign in with Google
            </Button>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 text-center font-medium mb-2">
                🔐 Authorized Admin Accounts
              </p>
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p className="text-center">• rk8766323@gmail.com</p>
                <p className="text-center">• arshbabar0@gmail.com</p>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 text-center mt-3">
                Other Google accounts will have viewer access
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
