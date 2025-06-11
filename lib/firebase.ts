// lib/firebase.ts

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Your Firebase config object (use env vars in production!)
const firebaseConfig = {
  apiKey: "AIzaSyCXME7V8fnbRyjoXGoxo3H_kzXawSlO3bM",
  authDomain: "projectmilkcartoncivicops.firebaseapp.com",
  projectId: "projectmilkcartoncivicops",
  storageBucket: "projectmilkcartoncivicops.appspot.com",   // <-- FIXED: was missing "appspot"
  messagingSenderId: "471340658313",
  appId: "1:471340658313:web:adfb0a3fca83c83b3a2058",
  measurementId: "G-G732K9402L"
};

// Initialize Firebase app (singleton pattern)
const firebaseApp: FirebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// Export initialized Firebase services
const auth: Auth = getAuth(firebaseApp);
const firestore: Firestore = getFirestore(firebaseApp);
const storage: FirebaseStorage = getStorage(firebaseApp);

export { firebaseApp, auth, firestore, storage };
