import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { firebaseApp } from './firebase';

export interface AuthResponse {
  user?: User;
  token?: string;
  error?: string;
}

const auth = getAuth(firebaseApp);

// Function to handle user login
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    return { user: userCredential.user, token };
  } catch (error) {
    console.error('Login error:', error);
    return { error: error.message };
  }
}

// Function to handle user registration
export async function registerUser(email: string, password: string): Promise<AuthResponse> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    return { user: userCredential.user, token };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: error.message };
  }
}

// Function to handle user logout
export async function logoutUser(): Promise<{ success: boolean; error?: string }> {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

// Function to get current authenticated user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}