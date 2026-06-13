import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import VerificationTokenModel from '@/lib/db/models/VerificationToken';
import { emailService } from '@/lib/services/emailService';

export async function POST(request: Request) {
  try {
    let body: { email?: string; password?: string; name?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Sanitize name - prevent HTML injection in emails and display
    const sanitizedName = name
      ? name.replace(/[<>&'"]/g, '').trim().slice(0, 50)
      : undefined;

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

    // Create user
    // First, check if any admin already exists to avoid race condition
    // (Two simultaneous registrations can't both become admin)
    const existingAdmin = await User.findOne({ role: 'admin' }).select('_id').lean();
    const isAdmin = !existingAdmin;

    const user = await User.create({
      email,
      password: hashedPassword,
      name: sanitizedName || email.split('@')[0],
      emailVerified: isAdmin ? new Date() : null,
      role: isAdmin ? 'admin' : 'user',
      settings: {
        keyboardLayout: 'qwerty',
        soundEnabled: true,
      },
    });

    // Log if first user/admin was created
    if (isAdmin) {
      console.log('🔐 First user created - assigned admin role and auto-verified:', email);

      // Return success immediately for first admin user (no email verification needed)
      return NextResponse.json(
        {
          message: 'Admin account created successfully. You can now sign in.',
          role: 'admin', // Used by frontend to trigger auto-login
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
