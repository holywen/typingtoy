import mongoose, { Schema, Model } from 'mongoose';

interface VerificationTokenDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  token: string;
  expires: Date;
  createdAt: Date;
}

const VerificationTokenSchema = new Schema<VerificationTokenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expires: {
      type: Date,
      required: true,
      // index removed - TTL index is defined below (line 37)
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired tokens
VerificationTokenSchema.index({ expires: 1 }, { expireAfterSeconds: 0 });

const VerificationTokenModel: Model<VerificationTokenDocument> =
  mongoose.models.VerificationToken ||
  mongoose.model<VerificationTokenDocument>('VerificationToken', VerificationTokenSchema);

export default VerificationTokenModel;
export type { VerificationTokenDocument };
