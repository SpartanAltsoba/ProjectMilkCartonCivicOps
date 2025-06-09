import { NextApiRequest, NextApiResponse } from 'next';
import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcryptjs';

const prisma = new PrismaClient();

export default NextAuth({
  providers: [
    Providers.Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      
      authorize: async (credentials) => {
        if (!credentials || !credentials.email || !credentials.password) {
          throw new Error('Missing fields');
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user) {
            throw new Error('No user found');
          }

          const isValid = await compare(credentials.password, user.password);

          if (!isValid) {
            throw new Error('Invalid password');
          }

          return { id: user.id, name: user.name, email: user.email };
        } catch (error) {
          console.error("Authorization error: ", error);
          throw new Error('Failed to authorize user');
        }
      }
    })
  ],

  session: {
    jwt: true
  },

  jwt: {
    secret: process.env.JWT_SECRET
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error' // Error code passed in query string as ?error=...
  },

  callbacks: {
    async jwt(token, user) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session(session, token) {
      session.user.id = token.id;
      return session;
    }
  }
});

// Utility function to get current authenticated user
export async function getCurrentUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await unstable_getServerSession(req, res, NextAuth(options));

    if (!session) {
      res.status(401).json({ error: 'Unauthorized' });
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Server error' });
    return null;
  }
}
