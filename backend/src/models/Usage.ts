import mongoose, { Document, Schema } from 'mongoose';
import { OPERATIONS } from '../lib/operations';

export interface IUsage extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  operation: string;
  fileCount: number;
  totalFileSize: number;
  createdAt: Date;
  updatedAt: Date;
}

const usageSchema = new Schema<IUsage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    operation: {
      type: String,
      required: true,
      enum: OPERATIONS,
    },
    fileCount: {
      type: Number,
      default: 1,
    },
    totalFileSize: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
usageSchema.index({ userId: 1, date: -1 });
usageSchema.index({ userId: 1, operation: 1, date: -1 });
usageSchema.index({ date: -1 });

// Compound index for daily usage aggregation
usageSchema.index({ userId: 1, date: 1 }, { unique: false });

export default mongoose.model<IUsage>('Usage', usageSchema);

