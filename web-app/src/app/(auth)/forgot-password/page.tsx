'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Warehouse, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { toast } from '@/lib/hooks/useToast';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await resetPassword(email);
      setEmailSent(true);
      toast.success('Email Sent!', 'Check your inbox for password reset instructions');
    } catch (err: any) {
      let errorMessage = 'Failed to send reset email';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later';
      }
      
      toast.error('Error', errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="max-w-md w-full relative">
        {/* Back to Login */}
        <Link 
          href="/login"
          className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl mb-4 shadow-lg">
            <Warehouse className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Enter your email to receive reset instructions
          </p>
        </div>

        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center">
              {emailSent ? 'Check Your Email' : 'Forgot Password'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!emailSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={loading}
                >
                  Send Reset Link
                </Button>

                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 <strong>Tip:</strong> Check your spam folder if you don't see the email within a few minutes.
                  </p>
                </div>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Email Sent!
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300">
                  We've sent a password reset link to:
                </p>
                
                <p className="font-semibold text-blue-600 dark:text-blue-400">
                  {email}
                </p>
                
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Click the link in the email to reset your password. The link will expire in 1 hour.
                </p>

                <div className="pt-4 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setEmailSent(false)}
                  >
                    Send Another Email
                  </Button>
                  
                  <Link href="/login" className="block">
                    <Button variant="ghost" className="w-full">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {!emailSent && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Remember your password?{' '}
                  <Link href="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
