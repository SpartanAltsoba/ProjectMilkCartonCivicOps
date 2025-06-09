import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDqXwbXokDPbD63Rhtve83h0AhpxRwEDGY",
  authDomain: "civic-trace-ops.firebaseapp.com",
  projectId: "civic-trace-ops",
  storageBucket: "civic-trace-ops.firebasestorage.app",
  messagingSenderId: "1005314849837",
  appId: "1:1005314849837:web:daac68ec05eb047ccc0ca4",
  measurementId: "G-252M80Q5N5",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
