'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn, signInWithGoogle } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Warehouse, Mail, Lock, ArrowLeft } from 'lucide-react';
import { toast } from '@/lib/hooks/useToast';

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    // Prevent flash by mounting component
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);

    try {
      await signIn(formData.email, formData.password);
      toast.success('Welcome!', 'Successfully signed in');
      router.push('/dashboard');
    } catch (err: any) {
      let errorMessage = 'Failed to sign in';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      }
      
      toast.error('Sign in failed', errorMessage);
      setEmailLoading(false);
    }
  };

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

  // Prevent rendering until mounted to avoid flash
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mb-4 shadow-lg animate-pulse">
            <Warehouse className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="max-w-md w-full relative">
        {/* Back to Home */}
        <Link 
          href="/"
          className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mb-4 shadow-lg">
            <Warehouse className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sign in to Smart Warehouse System
          </p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center">
              {showEmailForm ? 'Sign In with Email' : 'Choose Sign In Method'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showEmailForm ? (
              <>
                {/* Google Sign In */}
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
                  Continue with Google
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or</span>
                  </div>
                </div>

                {/* Email Sign In Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full border-2"
                  onClick={() => setShowEmailForm(true)}
                  leftIcon={<Mail className="w-5 h-5" />}
                >
                  Sign in with Email
                </Button>
              </>
            ) : (
              <>
                {/* Email/Password Form */}
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password
                      </label>
                      <Link 
                        href="/forgot-password"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    isLoading={emailLoading}
                  >
                    Sign In
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowEmailForm(false)}
                  >
                    Back to other options
                  </Button>
                </form>
              </>
            )}

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 text-center font-medium mb-2">
                🔐 Admin Accounts
              </p>
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p className="text-center">• rk8766323@gmail.com</p>
                <p className="text-center">• arshbabar0@gmail.com</p>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 text-center mt-3">
                Other accounts will have viewer access
              </p>
            </div>

            {/* Register Link */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Create one now
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
