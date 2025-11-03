import mongoose, { Schema, Model } from 'mongoose';
import type { UserProgress as IUserProgress } from '@/types';

interface ProgressDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  lessonId?: string;
  lessonTitle?: string;
  exerciseId?: string;
  exerciseTitle?: string;
  sessionType: 'lesson' | 'speed_test' | 'custom' | 'game';
  metrics: {
    grossWPM: number;
    netWPM: number;
    accuracy: number;
    duration: number;
    charactersTyped: number;
    errors: number;
    correctedErrors: number;
  };
  keystrokeData?: Array<{
    key: string;
    timestamp: number;
    correct: boolean;
    corrected: boolean;
  }>;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProgressSchema = new Schema<ProgressDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lessonId: {
      type: String,
    },
    lessonTitle: {
      type: String,
    },
    exerciseId: {
      type: String,
    },
    exerciseTitle: {
      type: String,
    },
    sessionType: {
      type: String,
      enum: ['lesson', 'speed_test', 'custom', 'game'],
      required: true,
    },
    metrics: {
      grossWPM: {
        type: Number,
        required: true,
      },
      netWPM: {
        type: Number,
        required: true,
      },
      accuracy: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      duration: {
        type: Number,
        required: true,
      },
      charactersTyped: {
        type: Number,
        required: true,
      },
      errors: {
        type: Number,
        required: true,
      },
      correctedErrors: {
        type: Number,
        required: true,
      },
    },
    keystrokeData: [{
      key: String,
      timestamp: Number,
      correct: Boolean,
      corrected: Boolean,
    }],
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for efficient queries
ProgressSchema.index({ userId: 1, completedAt: -1 });
ProgressSchema.index({ lessonId: 1 });
ProgressSchema.index({ sessionType: 1 });
ProgressSchema.index({ 'metrics.netWPM': -1 }); // For leaderboards

const ProgressModel: Model<ProgressDocument> =
  mongoose.models.Progress || mongoose.model<ProgressDocument>('Progress', ProgressSchema);

export default ProgressModel;
export type { ProgressDocument };
