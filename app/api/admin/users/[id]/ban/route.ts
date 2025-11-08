import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verify admin access
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { banned, banReason } = body;

    // Connect to database
    await connectDB();

    // Get current session
    const session = await auth();

    // Prevent admin from banning themselves
    if (session?.user?.id === id) {
      return NextResponse.json(
        { error: 'Cannot ban your own account' },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update ban status
    user.banned = banned === true;

    if (user.banned) {
      user.banReason = banReason || 'No reason provided';
      user.bannedAt = new Date();
    } else {
      // Clear ban information when unbanning
      user.banReason = undefined;
      user.bannedAt = undefined;
    }

    await user.save();

    // Return user without password
    const userObject = user.toObject();
    delete userObject.password;

    return NextResponse.json({
      message: user.banned ? 'User banned successfully' : 'User unbanned successfully',
      user: userObject,
    });
  } catch (error) {
    console.error('Error updating user ban status:', error);

    if (error instanceof Error && error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update user ban status' },
      { status: 500 }
    );
  }
}
