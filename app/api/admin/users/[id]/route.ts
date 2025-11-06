import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verify admin access
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();

    // Connect to database
    await connectDB();

    // Get current session
    const session = await auth();

    // Prevent admin from changing their own role
    if (session?.user?.id === id && body.role) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Find and update user
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update allowed fields
    if (body.role && (body.role === 'user' || body.role === 'admin')) {
      user.role = body.role;
    }

    if (body.name !== undefined) {
      user.name = body.name;
    }

    if (body.settings) {
      user.settings = { ...user.settings, ...body.settings };
    }

    await user.save();

    // Return user without password
    const userObject = user.toObject();
    delete userObject.password;

    return NextResponse.json({
      message: 'User updated successfully',
      user: userObject,
    });
  } catch (error) {
    console.error('Error updating user:', error);

    if (error instanceof Error && error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verify admin access
    await requireAdmin();

    const { id } = await params;

    // Connect to database
    await connectDB();

    // Get current session
    const session = await auth();

    // Prevent admin from deleting themselves
    if (session?.user?.id === id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Find and delete user
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);

    if (error instanceof Error && error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
