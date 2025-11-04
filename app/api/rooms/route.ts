// Rooms API - Get active rooms

import { NextRequest, NextResponse } from 'next/server';
import { RoomManager } from '@/lib/services/roomManager';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gameType = searchParams.get('gameType');

    const rooms = await RoomManager.getActiveRooms(gameType || undefined);

    // Filter out full rooms (optional)
    const showFull = searchParams.get('showFull') === 'true';
    const filteredRooms = showFull
      ? rooms
      : rooms.filter(r => r.players.length < r.maxPlayers);

    return NextResponse.json({
      success: true,
      rooms: filteredRooms,
      total: filteredRooms.length,
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}
