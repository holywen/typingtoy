import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import VerificationTokenModel from '@/lib/db/models/VerificationToken';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Find the verification token
    const verificationToken = await VerificationTokenModel.findOne({ token });

    if (!verificationToken) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await VerificationTokenModel.deleteOne({ _id: verificationToken._id });
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new verification email.' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(verificationToken.userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      // Delete the token since it's no longer needed
      await VerificationTokenModel.deleteOne({ _id: verificationToken._id });
      return NextResponse.json(
        { message: 'Email already verified' },
        { status: 200 }
      );
    }

    // Update user's emailVerified field
    user.emailVerified = new Date();
    await user.save();

    // Delete the verification token
    await VerificationTokenModel.deleteOne({ _id: verificationToken._id });

    return NextResponse.json(
      {
        message: 'Email verified successfully. You can now sign in.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for when users click the link in their email
export async function GET(request: Request) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        `${baseUrl}/auth/verify-email?error=missing_token`
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Find the verification token
    const verificationToken = await VerificationTokenModel.findOne({ token });

    if (!verificationToken) {
      return NextResponse.redirect(
        `${baseUrl}/auth/verify-email?error=invalid_token`
      );
    }

    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await VerificationTokenModel.deleteOne({ _id: verificationToken._id });
      return NextResponse.redirect(
        `${baseUrl}/auth/verify-email?error=expired_token`
      );
    }

    // Find the user
    const user = await User.findById(verificationToken.userId);

    if (!user) {
      return NextResponse.redirect(
        `${baseUrl}/auth/verify-email?error=user_not_found`
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      // Delete the token since it's no longer needed
      await VerificationTokenModel.deleteOne({ _id: verificationToken._id });
      return NextResponse.redirect(
        `${baseUrl}/auth/verify-email?success=already_verified`
      );
    }

    // Update user's emailVerified field
    user.emailVerified = new Date();
    await user.save();

    // Delete the verification token
    await VerificationTokenModel.deleteOne({ _id: verificationToken._id });

    return NextResponse.redirect(
      `${baseUrl}/auth/verify-email?success=true`
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.redirect(
      `${baseUrl}/auth/verify-email?error=server_error`
    );
  }
}
