/**
 * Script to set the first user as admin and verify their email
 * Usage: npx ts-node scripts/set-first-admin.ts <email>
 */

import mongoose from 'mongoose';
import User from '../lib/db/models/User';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function setFirstAdmin(email?: string) {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    let user;

    if (email) {
      // Find specific user by email
      user = await User.findOne({ email });
      if (!user) {
        console.log(`❌ User with email "${email}" not found`);
        process.exit(1);
      }
    } else {
      // Find the first created user
      user = await User.findOne().sort({ createdAt: 1 });
      if (!user) {
        console.log('❌ No users found in database');
        process.exit(1);
      }
    }

    // Update user to admin and verify email
    user.role = 'admin';
    user.emailVerified = new Date();
    await user.save();

    console.log('✅ Successfully updated user:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email Verified: ${user.emailVerified}`);
    console.log('\n🎉 User can now sign in as admin!');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (process.argv.length > 2 && !email) {
  console.log('Usage: npx ts-node scripts/set-first-admin.ts [email]');
  console.log('  email (optional): Specific user email to set as admin');
  console.log('  If no email provided, the first registered user will be set as admin');
  process.exit(1);
}

setFirstAdmin(email);
