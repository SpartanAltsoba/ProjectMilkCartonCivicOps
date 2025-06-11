import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../lib/firebase'; // assuming firebase configuration is exported from lib/firebase.ts

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
}

interface AuthPayload {
  email: string;
  password: string;
  action: 'login' | 'register';
}

const handler = async (req: NextApiRequest, res: NextApiResponse<AuthResponse>) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { email, password, action }: AuthPayload = req.body;

  try {
    if (action === 'register') {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      return res.status(201).json({ success: true, token });
    } else if (action === 'login') {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      return res.status(200).json({ success: true, token });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error in authentication:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export default handler;
