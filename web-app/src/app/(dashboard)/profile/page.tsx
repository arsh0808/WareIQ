'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  User, Mail, Lock, Camera, Save, Shield, Calendar, 
  MapPin, Phone, Building, AlertCircle, CheckCircle 
} from 'lucide-react';
import { toast } from '@/lib/hooks/useToast';
import { updateProfile, updatePassword, sendEmailVerification } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth, storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { RoleBadge } from '@/components/PermissionGuard';

export default function ProfilePage() {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setProfileData({
          name: data.name || user.displayName || '',
          email: user.email || '',
          phone: data.phone || '',
          location: data.location || '',
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Error', 'Failed to load profile data');
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: profileData.name,
      });

      // Update Firestore user document
      await updateDoc(doc(db, 'users', user.uid), {
        name: profileData.name,
        phone: profileData.phone,
        location: profileData.location,
        updatedAt: new Date(),
      });

      toast.success('Success!', 'Profile updated successfully');
      loadUserData();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Error', 'Password must be at least 6 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      await updatePassword(user, passwordData.newPassword);
      
      toast.success('Success!', 'Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      let errorMessage = 'Failed to update password';
      
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please sign out and sign in again to change your password';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }
      
      toast.error('Error', errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Error', 'Image size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Error', 'Please upload an image file');
      return;
    }

    setPhotoLoading(true);
    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Update Firebase Auth profile
      await updateProfile(user, { photoURL });

      // Update Firestore user document
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL,
        updatedAt: new Date(),
      });

      toast.success('Success!', 'Profile photo updated successfully');
      loadUserData();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error('Error', 'Failed to upload photo');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;

    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/dashboard`,
        handleCodeInApp: false,
      });
      toast.success('Email Sent!', 'Check your inbox for the verification link');
    } catch (error: any) {
      toast.error('Error', 'Failed to send verification email');
    }
  };

  if (!user || !userRole) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Photo & Quick Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Photo */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={profileData.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{profileData.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              
              <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={photoLoading}
                />
              </label>
              
              {photoLoading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {profileData.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-3 flex items-center justify-center md:justify-start space-x-2">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <RoleBadge role={userRole.role} />
                
                {user.emailVerified ? (
                  <Badge variant="success" className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Verified</span>
                  </Badge>
                ) : (
                  <Badge variant="warning" className="flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Unverified</span>
                  </Badge>
                )}
                
                {userData?.warehouseId && (
                  <Badge variant="default" className="flex items-center space-x-1">
                    <Building className="w-3 h-3" />
                    <span>{userData.warehouseId}</span>
                  </Badge>
                )}
              </div>

              {!user.emailVerified && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={handleResendVerification}
                >
                  Resend Verification Email
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Account Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="bg-gray-100 dark:bg-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    name="location"
                    value={profileData.location}
                    onChange={handleProfileChange}
                    placeholder="New York, USA"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={loading} leftIcon={<Save className="w-4 h-4" />}>
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="w-5 h-5" />
            <span>Change Password</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <Input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>Password Requirements:</strong>
                </p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-disc list-inside">
                  <li>At least 6 characters long</li>
                  <li>Use a unique password you haven't used before</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={passwordLoading} leftIcon={<Lock className="w-4 h-4" />}>
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Account Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Account Created</p>
              <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                <Calendar className="w-4 h-4" />
                <span>{userData?.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Login</p>
              <div className="flex items-center space-x-2 text-gray-900 dark:text-white">
                <Calendar className="w-4 h-4" />
                <span>{userData?.lastLogin?.toDate?.()?.toLocaleDateString() || 'N/A'}</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">User ID</p>
              <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {user.uid}
              </code>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Role</p>
              <RoleBadge role={userRole.role} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
