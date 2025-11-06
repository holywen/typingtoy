import dotenv from 'dotenv';
import path from 'path';
import connectDB from '../lib/db/mongodb';
import User from '../lib/db/models/User';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function verifyPassword() {
  console.log('🔍 Verifying test user password...\n');

  try {
    // Connect to MongoDB
    await connectDB();

    // Test user credentials
    const TEST_EMAIL = 'test@typingtoy.com';
    const TEST_PASSWORD = 'TestPassword123!';

    // Find user
    const user = await User.findOne({ email: TEST_EMAIL });

    if (!user) {
      console.log('❌ User not found:', TEST_EMAIL);
      process.exit(1);
    }

    console.log('✅ User found in database');
    console.log(`   User ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
    console.log(`   Password hash length: ${user.password?.length || 0}`);

    // Verify password
    if (!user.password) {
      console.log('❌ No password hash found for user');
      process.exit(1);
    }

    console.log('\n🔐 Testing password comparison...');
    const isValid = await bcrypt.compare(TEST_PASSWORD, user.password);

    if (isValid) {
      console.log('✅ Password comparison SUCCESSFUL');
      console.log(`   Password "${TEST_PASSWORD}" matches the hash in database`);
    } else {
      console.log('❌ Password comparison FAILED');
      console.log(`   Password "${TEST_PASSWORD}" does NOT match the hash in database`);
    }

    // Also try with different variations
    console.log('\n🧪 Testing password variations...');
    const variations = [
      'testpassword123!',
      'TESTPASSWORD123!',
      'TestPassword123',
      ' TestPassword123!',
      'TestPassword123! ',
    ];

    for (const variant of variations) {
      const result = await bcrypt.compare(variant, user.password);
      console.log(`   "${variant}": ${result ? '✅ MATCH' : '❌ no match'}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyPassword();
