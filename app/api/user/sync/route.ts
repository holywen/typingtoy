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

    const { data } = await request.json();

    await connectDB();

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user settings
    if (data.settings) {
      user.settings = data.settings;
    }

    // Update last positions
    if (data.lastPositions) {
      const lastPositionsMap = new Map();
      Object.entries(data.lastPositions).forEach(([key, value]: [string, any]) => {
        lastPositionsMap.set(key, {
          lessonId: value.lessonId,
          exerciseIndex: value.exerciseIndex,
          timestamp: new Date(value.timestamp),
        });
      });
      user.lastPositions = lastPositionsMap;
    }

    await user.save();

    // Save progress history
    if (data.progressHistory && Array.isArray(data.progressHistory)) {
      // Save new progress records (avoid duplicates)
      for (const record of data.progressHistory) {
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
