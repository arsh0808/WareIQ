import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
// Use hardcoded config temporarily to bypass .env issues
import { auth, db } from './config-hardcoded';

export interface UserRole {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'staff' | 'viewer';
  warehouseId: string;
  photoURL?: string;
  createdAt: Date;
  lastLogin: Date;
}

export async function signUp(
  email: string,
  password: string,
  name: string,
  role: UserRole['role'],
  warehouseId: string
): Promise<UserCredential> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(userCredential.user, { displayName: name });

    // Send email verification
    const { sendEmailVerification } = await import('firebase/auth');
    await sendEmailVerification(userCredential.user, {
      url: `${window.location.origin}/dashboard`,
      handleCodeInApp: false,
    });

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      name,
      role,
      warehouseId,
      photoURL: userCredential.user.photoURL || '',
      createdAt: new Date(),
      lastLogin: new Date(),
      emailVerified: false,
    });

    return userCredential;
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

export async function signIn(email: string, password: string): Promise<UserCredential> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    await setDoc(
      doc(db, 'users', userCredential.user.uid),
      { lastLogin: new Date() },
      { merge: true }
    );

    return userCredential;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      return userDoc.data() as UserRole;
    }
    
    return null;
  } catch (error) {
    console.error('Get user role error:', error);
    return null;
  }
}

export function hasRole(user: UserRole | null, allowedRoles: UserRole['role'][]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

export function isAdmin(user: UserRole | null): boolean {
  return hasRole(user, ['admin']);
}

export function isManager(user: UserRole | null): boolean {
  return hasRole(user, ['admin', 'manager']);
}

export function isStaff(user: UserRole | null): boolean {
  return hasRole(user, ['admin', 'manager', 'staff']);
}

// Admin emails that get automatic admin role
const ADMIN_EMAILS = ['rk8766323@gmail.com', 'arshbabar0@gmail.com'];

export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);

    const userEmail = userCredential.user.email?.toLowerCase() || '';
    
    // Check if user email is in admin list
    const isAdminEmail = ADMIN_EMAILS.includes(userEmail);
    
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDoc.exists()) {
      // New user - create profile
      const role = isAdminEmail ? 'admin' : 'viewer'; // Admin for allowed emails, viewer for others
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || 'User',
        role: role,
        warehouseId: 'warehouse-001', // Default warehouse
        photoURL: userCredential.user.photoURL || '',
        createdAt: new Date(),
        lastLogin: new Date()
      });
    } else {
      // Existing user - update last login and photo
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        lastLogin: new Date(),
        photoURL: userCredential.user.photoURL || ''
      }, { merge: true });
    }
    
    return userCredential;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}
