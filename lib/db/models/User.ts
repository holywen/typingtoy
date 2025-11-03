import mongoose, { Schema, Model } from 'mongoose';
import type { User as IUser } from '@/types';

interface UserDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name?: string;
  password?: string;
  image?: string;
  emailVerified?: Date;
  settings: {
    keyboardLayout: string;
    soundEnabled: boolean;
  };
  lastPositions: Map<string, {
    lessonId: string;
    exerciseIndex: number;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    name: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
    },
    image: {
      type: String,
    },
    emailVerified: {
      type: Date,
    },
    settings: {
      keyboardLayout: {
        type: String,
        enum: ['qwerty', 'dvorak', 'colemak', 'workman', 'azerty', 'qwertz', 'qwerty-uk', 'programmer', 'spanish', 'latin'],
        default: 'qwerty',
      },
      soundEnabled: {
        type: Boolean,
        default: true,
      },
    },
    lastPositions: {
      type: Map,
      of: {
        lessonId: String,
        exerciseIndex: Number,
        timestamp: Date,
      },
      default: new Map(),
    },
  },
  {
    timestamps: true,
  }
);

// Indexes are automatically created by unique: true in schema

// Create or retrieve the model
const UserModel: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);

export default UserModel;
export type { UserDocument };
