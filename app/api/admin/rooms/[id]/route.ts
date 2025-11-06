import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import connectDB from '@/lib/db/mongodb';
import GameRoom from '@/lib/db/models/GameRoom';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Verify admin access
    await requireAdmin();

    const { id } = await params;

    // Connect to database
    await connectDB();

    // Find room by ID or roomId
    const room = await GameRoom.findOne({
      $or: [{ _id: id }, { roomId: id }],
    }).lean();

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Error fetching room:', error);

    if (error instanceof Error && error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch room' },
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

    // Find and delete room by ID or roomId
    const room = await GameRoom.findOneAndDelete({
      $or: [{ _id: id }, { roomId: id }],
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Room deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting room:', error);

    if (error instanceof Error && error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    );
  }
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

    // Find room
    const room = await GameRoom.findOne({
      $or: [{ _id: id }, { roomId: id }],
    });

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Update status (force close/finish)
    if (body.status && ['waiting', 'playing', 'finished'].includes(body.status)) {
      room.status = body.status;

      if (body.status === 'finished' && !room.endedAt) {
        room.endedAt = new Date();
      }
    }

    await room.save();

    return NextResponse.json({
      message: 'Room updated successfully',
      room,
    });
  } catch (error) {
    console.error('Error updating room:', error);

    if (error instanceof Error && error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    );
  }
}
