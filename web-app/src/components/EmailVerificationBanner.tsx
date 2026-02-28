'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { sendEmailVerification } from 'firebase/auth';
import { Button } from './ui/Button';
import { Mail, X, CheckCircle } from 'lucide-react';
import { toast } from '@/lib/hooks/useToast';

interface EmailVerificationBannerProps {
  user: User;
}

export function EmailVerificationBanner({ user }: EmailVerificationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // Check if email is not verified
    if (user && !user.emailVerified) {
      setIsVisible(true);
    }
  }, [user]);

  useEffect(() => {
    // Cooldown timer
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    setSending(true);
    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/dashboard`,
        handleCodeInApp: false,
      });
      toast.success('Email Sent!', 'Check your inbox for the verification link');
      setCooldown(60); // 60 second cooldown
    } catch (error: any) {
      let errorMessage = 'Failed to send verification email';
      
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later';
      }
      
      toast.error('Error', errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  if (!isVisible || user.emailVerified) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <Mail className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Verify your email address</p>
              <p className="text-sm text-white/90">
                A verification link has been sent to <strong>{user.email}</strong>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReload}
              className="bg-white/20 hover:bg-white/30 border-white/40 text-white"
              leftIcon={<CheckCircle className="w-4 h-4" />}
            >
              I've Verified
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleResendEmail}
              isLoading={sending}
              disabled={cooldown > 0}
              className="bg-white/20 hover:bg-white/30 border-white/40 text-white"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Email'}
            </Button>
            
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
