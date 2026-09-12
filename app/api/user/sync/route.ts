import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/db/models/User';
import Progress from '@/lib/db/models/Progress';

// GET: Load user data from database
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's progress history
    const progressRecords = await Progress.find({ userId: user._id })
      .sort({ completedAt: -1 })
      .limit(100)
      .lean();

    // Convert lastPositions Map to object
    const lastPositions: Record<string, any> = {};
    if (user.lastPositions) {
      user.lastPositions.forEach((value, key) => {
        lastPositions[key] = value;
      });
    }

    return NextResponse.json({
      settings: user.settings,
      progressHistory: progressRecords.map(record => ({
        id: record._id.toString(),
        lessonId: record.lessonId?.toString(),
        lessonTitle: record.lessonTitle,
        sessionType: record.sessionType,
        metrics: record.metrics,
        completedAt: record.completedAt,
        exerciseId: record.exerciseId,
        exerciseTitle: record.exerciseTitle,
      })),
      lastPositions,
    });
  } catch (error) {
    console.error('Sync GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Save user data to database
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let data: any;
    try {
      data = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Whitelist allowed settings fields to prevent mass assignment
    if (data.settings && typeof data.settings === 'object') {
      const allowedSettings = ['keyboardLayout', 'soundEnabled', 'language', 'theme', 'showKeyboard', 'showHandDiagram', 'highlightErrors'];
      const sanitizedSettings: Record<string, any> = {};
      for (const key of allowedSettings) {
        if (key in data.settings) {
          sanitizedSettings[key] = data.settings[key];
        }
      }
      user.settings = { ...user.settings, ...sanitizedSettings };
    }

    // Update last positions - validate structure
    if (data.lastPositions && typeof data.lastPositions === 'object') {
      const lastPositionsMap = new Map();
      for (const [key, value] of Object.entries(data.lastPositions)) {
        const pos = value as Record<string, unknown>;
        if (pos && typeof pos === 'object' && 'lessonId' in pos && 'exerciseIndex' in pos) {
          lastPositionsMap.set(key, {
            lessonId: String(pos.lessonId),
            exerciseIndex: Number(pos.exerciseIndex),
            timestamp: pos.timestamp ? new Date(String(pos.timestamp)) : new Date(),
          });
        }
      }
      if (lastPositionsMap.size > 0) {
        user.lastPositions = lastPositionsMap;
      }
    }

    await user.save();

    // Save progress history - validate each record
    if (data.progressHistory && Array.isArray(data.progressHistory)) {
      for (const record of data.progressHistory) {
        if (!record.completedAt || !record.metrics) continue;

        const exists = await Progress.findOne({
          userId: user._id,
          completedAt: record.completedAt,
          'metrics.netWPM': record.metrics.netWPM,
        });

        if (!exists) {
          await Progress.create({
            userId: user._id,
            lessonId: record.lessonId,
            lessonTitle: record.lessonTitle,
            sessionType: record.sessionType,
            metrics: record.metrics,
            completedAt: record.completedAt,
            exerciseId: record.exerciseId,
            exerciseTitle: record.exerciseTitle,
          });
        }
      }
    }

    return NextResponse.json({ message: 'Data synced successfully' });
  } catch (error) {
    console.error('Sync POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
