'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged, updatePassword, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { getUserRole, type UserRole } from '@/lib/firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { User, Lock, Bell, Palette, Database, Shield } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/lib/hooks/useToast';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    lowStock: true,
    criticalAlerts: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setDisplayName(user.displayName || '');
        const role = await getUserRole(user.uid);
        setUserRole(role);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    try {
      await updateProfile(user, { displayName });
      await updateDoc(doc(db, 'users', user.uid), {
        name: displayName,
      });
      toast.success('Profile updated', 'Your profile has been updated successfully');
    } catch (error: any) {
      toast.error('Update failed', error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match', 'Please check your passwords');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password too short', 'Password must be at least 6 characters');
      return;
    }

    setSavingPassword(true);
    try {
      await updatePassword(user, newPassword);
      toast.success('Password updated', 'Your password has been changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error('Password update failed', error.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Settings saved', 'Notification preferences updated');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Account Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {user?.displayName || user?.email}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {user?.email}
                  </p>
                  <Badge variant={
                    userRole?.role === 'admin' ? 'success' :
                    userRole?.role === 'manager' ? 'info' :
                    'default'
                  }>
                    {userRole?.role?.toUpperCase()}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {}
            <div className="lg:col-span-2 space-y-6">
              {}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <Input
                      label="Display Name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      helperText="Email cannot be changed"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={savingProfile}
                    >
                      Save Profile
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <Input
                      label="New Password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <Input
                      label="Confirm Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={savingPassword}
                      disabled={!newPassword || !confirmPassword}
                    >
                      Update Password
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Theme</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Current theme: {theme === 'dark' ? 'Dark' : 'Light'}
                      </p>
                    </div>
                    <Button variant="outline" onClick={toggleTheme}>
                      Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Receive {key} notifications
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleNotificationToggle(key as any)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Two-Factor Authentication
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Add an extra layer of security
                        </p>
                      </div>
                      <Badge variant="default">Coming Soon</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Login History
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          View recent login activity
                        </p>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          </div>);}
