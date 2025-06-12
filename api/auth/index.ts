import type { NextApiRequest, NextApiResponse } from 'next';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';

interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuthResponse>
) {
  const { method } = req;

  try {
    if (method === 'POST') {
      const { email, password, action } = req.body;

      if (action === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        return res.status(201).json({ success: true, token });
      }

      if (action === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        return res.status(200).json({ success: true, token });
      }

      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });

  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
}

