/**
 * Firebase Configuration - Hardcoded for Testing
 * 
 * This file uses hardcoded values to bypass .env loading issues
 * Use this temporarily to test if Firebase works
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Hardcoded Firebase config - Your actual values
const firebaseConfig = {
  apiKey: "AIzaSyDNjxezQLIGIgWDRMDg63ukejFFisZvgAc",
  authDomain: "wareiq-5f654.firebaseapp.com",
  projectId: "wareiq-5f654",
  storageBucket: "wareiq-5f654.firebasestorage.app",
  messagingSenderId: "790490427408",
  appId: "1:790490427408:web:fc40eacb7c24233f125a95",
  databaseURL: "https://wareiq-5f654-default-rtdb.firebaseio.com",
  measurementId: "G-25X5XW55QR"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let rtdb: Database;
let storage: FirebaseStorage;

if (typeof window !== 'undefined') {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized successfully (hardcoded config)');
    } else {
      app = getApps()[0];
      console.log('✅ Firebase already initialized');
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    rtdb = getDatabase(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
  }
}

export { app, auth, db, rtdb, storage };
