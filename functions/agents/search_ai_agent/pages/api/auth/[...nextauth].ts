import NextAuth from "next-auth";
import Providers from "next-auth/providers";
import { NextApiHandler } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const options = {
  providers: [
    Providers.Credentials({
      // The name to display on the sign-in form (e.g. 'Sign in with...')
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        // Basic validation
        if (!credentials.username || !credentials.password) {
          throw new Error('Please enter both username and password');
        }

        // Fetch user from the database using provided credentials
        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (user && user.password === credentials.password) { // To be replaced with hashed password checking
          return { id: user.id, name: user.name, email: user.email };
        }

        // Return null if user data could not be fetched
        throw new Error('Invalid username or password');
      },
    }),
    // Add other providers as needed
  ],
  session: {
    jwt: true,
  },
  callbacks: {
    async jwt(token, user) {
      // Add user info to token on login
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session(session, token) {
      // Add user ID on session object
      session.user.id = token.id;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin', // Custom sign-in page
  },
  debug: process.env.NODE_ENV === 'development',
  events: {
    async signIn(message) {
      console.log('User signed in:', message);
    },
    async signOut(message) {
      console.log('User signed out:', message);
    },
    async error(message) {
      console.error('Error:', message);
    },
  },
  // Add database logging or other options as required
};

const authHandler: NextApiHandler = (req, res) => NextAuth(req, res, options);
export default authHandler;

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});