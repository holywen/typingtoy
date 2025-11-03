import mongoose, { Schema, Model } from 'mongoose';
import type { Lesson as ILesson } from '@/types';

interface LessonDocument extends Omit<ILesson, 'id' | 'prerequisites'>, mongoose.Document {
  _id: mongoose.Types.ObjectId;
  prerequisites: mongoose.Types.ObjectId[];
}

const LessonSchema = new Schema<LessonDocument>(
  {
    lessonNumber: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      max: 15,
    },
    title: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    keyboardLayout: {
      type: String,
      enum: ['qwerty', 'dvorak', 'colemak', 'workman', 'azerty', 'qwertz'],
      default: 'qwerty',
    },
    language: {
      type: String,
      default: 'en',
    },
    focusKeys: [{
      type: String,
    }],
    prerequisites: [{
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
    }],
    estimatedTime: {
      type: Number, // in minutes
      default: 10,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes
LessonSchema.index({ lessonNumber: 1 });
LessonSchema.index({ difficulty: 1 });
LessonSchema.index({ language: 1 });

const LessonModel: Model<LessonDocument> =
  mongoose.models.Lesson || mongoose.model<LessonDocument>('Lesson', LessonSchema);

export default LessonModel;
export type { LessonDocument };
