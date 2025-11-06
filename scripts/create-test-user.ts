import dotenv from 'dotenv';
import path from 'path';
import connectDB from '../lib/db/mongodb';
import User from '../lib/db/models/User';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function createTestUser() {
  console.log('🔧 Creating test user...\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected\n');

    // Test user credentials
    const testUser = {
      email: 'test@typingtoy.com',
      password: 'TestPassword123!',
      name: 'Test User',
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email: testUser.email });

    if (existingUser) {
      console.log(`ℹ️  Test user already exists: ${testUser.email}`);
      console.log(`   User ID: ${existingUser._id}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Email Verified: ${existingUser.emailVerified ? 'Yes' : 'No'}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log('\n✅ Test user is ready to use\n');

      console.log('📋 Test Credentials:');
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Password: ${testUser.password}\n`);

      process.exit(0);
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    console.log('✅ Password hashed\n');

    // Create user
    console.log('👤 Creating user in database...');
    const user = await User.create({
      email: testUser.email,
      password: hashedPassword,
      name: testUser.name,
      emailVerified: new Date(), // Auto-verify for test user
      role: 'user',
      settings: {
        keyboardLayout: 'qwerty',
        soundEnabled: true,
      },
    });

    console.log('✅ Test user created successfully!\n');
    console.log('📋 User Details:');
    console.log(`   User ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email Verified: Yes`);
    console.log('\n📋 Test Credentials:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}\n`);
    console.log('💡 Use these credentials in your Playwright tests\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();
