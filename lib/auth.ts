import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from './db/mongoClient';
import connectDB from './db/mongodb';
import User from './db/models/User';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Connect to MongoDB
          await connectDB();

          // Find user
          const user = await User.findOne({ email: credentials.email });

          if (!user || !user.password) {
            return null;
          }

          // Verify password
          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isValid) {
            return null;
          }

          // Check if email is verified (skip for admin users)
          if (!user.emailVerified && user.role !== 'admin') {
            return null;
          }

          // Return user object for session
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || user.email,
          };
        } catch (error) {
          console.error('Error in authorize:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth providers, check if this is the first user and set as admin
      if (account?.provider === 'google') {
        try {
          // Use the same MongoDB client that MongoDBAdapter uses
          const client = await clientPromise;
          const db = client.db();
          const usersCollection = db.collection('users');

          // Check total user count in the same database as MongoDBAdapter
          const userCount = await usersCollection.countDocuments();

          console.log(`[OAuth SignIn] User count: ${userCount}, Email: ${user.email}, DB: ${db.databaseName}`);

          // If this is the first user, set them as admin and auto-verify email
          if (userCount <= 1) {
            // Use native MongoDB updateOne to directly update the collection
            const result = await usersCollection.updateOne(
              { email: user.email },
              {
                $set: {
                  role: 'admin',
                  emailVerified: new Date()
                }
              }
            );

            console.log(`[OAuth SignIn] Set first user as admin. Modified: ${result.modifiedCount}`);
          }
        } catch (error) {
          console.error('[OAuth SignIn] Error setting admin role:', error);
          // Don't block sign-in if this fails
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      // On sign in (when user object is available)
      if (user) {
        token.id = user.id;
      }

      // For OAuth providers, if id is not set, use sub (subject) from token
      if (!token.id && token.sub) {
        token.id = token.sub;
      }

      // Fetch role from database if not already in token
      if (token.id && !token.role) {
        await connectDB();
        const dbUser = await User.findById(token.id);
        if (dbUser) {
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'user' | 'admin';
      }
      return session;
    },
  },
});
