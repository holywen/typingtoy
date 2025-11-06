import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import clientPromise from './db/mongoClient';
import connectDB from './db/mongodb';
import User from './db/models/User';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

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
      // Allow sign in
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      // On sign in (when user object is available)
      if (user) {
        token.id = user.id;

        // For OAuth sign in, check if this is the first user and set as admin
        if (account?.provider === 'google') {
          try {
            // Use the same MongoDB client that MongoDBAdapter uses
            const client = await clientPromise;
            const db = client.db();
            const usersCollection = db.collection('users');

            // Check total user count in the same database as MongoDBAdapter
            const userCount = await usersCollection.countDocuments();

            console.log(`[OAuth JWT] User count: ${userCount}, User ID: ${user.id}, DB: ${db.databaseName}`);

            // If this is the first user, set them as admin and auto-verify email
            if (userCount <= 1) {
              // Use native MongoDB updateOne to directly update the collection
              const result = await usersCollection.updateOne(
                { _id: new ObjectId(user.id) },
                {
                  $set: {
                    role: 'admin',
                    emailVerified: new Date()
                  }
                }
              );

              console.log(`[OAuth JWT] Set first user as admin. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

              // Set role in token immediately
              if (result.modifiedCount > 0) {
                token.role = 'admin';
              }
            }
          } catch (error) {
            console.error('[OAuth JWT] Error setting admin role:', error);
          }
        }
      }

      // For OAuth providers, if id is not set, use sub (subject) from token
      if (!token.id && token.sub) {
        token.id = token.sub;
      }

      // Fetch role from database if not already in token
      if (token.id && !token.role) {
        try {
          const client = await clientPromise;
          const db = client.db();
          const usersCollection = db.collection('users');

          // Query by ObjectId
          const dbUser = await usersCollection.findOne({ _id: new ObjectId(token.id as string) });
          if (dbUser && dbUser.role) {
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error('[JWT] Error fetching user role:', error);
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
