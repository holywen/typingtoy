import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import VerificationTokenModel from '@/lib/db/models/VerificationToken';
import { emailService } from '@/lib/services/emailService';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if this is the first user (will be admin)
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    // Create user
    // First user (admin) gets auto-verified, others need to verify email
    const user = await User.create({
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      emailVerified: isFirstUser ? new Date() : null, // Auto-verify first admin user
      role: isFirstUser ? 'admin' : 'user', // First user becomes admin
      settings: {
        keyboardLayout: 'qwerty',
        soundEnabled: true,
      },
    });

    // Log if first user/admin was created
    if (isFirstUser) {
      console.log('🔐 First user created - assigned admin role and auto-verified:', email);

      // Return success immediately for first admin user (no email verification needed)
      return NextResponse.json(
        {
          message: 'Admin account created successfully. You can now sign in.',
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: 'admin',
          },
        },
        { status: 201 }
      );
    }

    // For non-admin users, send verification email
    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Save verification token to database
    await VerificationTokenModel.create({
      userId: user._id,
      token,
      expires,
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, token, user.name);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Note: We don't fail the registration if email sending fails
      // User can request resend verification email later
    }

    return NextResponse.json(
      {
        message: 'User created successfully. Please check your email to verify your account.',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
