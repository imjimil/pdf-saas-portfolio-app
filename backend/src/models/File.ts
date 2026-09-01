import mongoose, { Document, Schema } from 'mongoose';
import { OPERATIONS } from '../lib/operations';

export interface IFile extends Document {
  userId?: mongoose.Types.ObjectId;
  originalFileName: string;
  processedFileName: string;
  operation: string;
  fileSize: number;
  status: 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new Schema<IFile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for guest users
      index: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    processedFileName: {
      type: String,
      required: true,
    },
    operation: {
      type: String,
      required: true,
      enum: OPERATIONS,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'completed',
    },
    downloadUrl: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
fileSchema.index({ userId: 1, createdAt: -1 });
fileSchema.index({ userId: 1, operation: 1 });
fileSchema.index({ createdAt: -1 });

export default mongoose.model<IFile>('File', fileSchema);

