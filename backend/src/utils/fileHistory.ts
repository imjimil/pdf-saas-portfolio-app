import File from '../models/File';
import Usage from '../models/Usage';
import path from 'path';
import fs from 'fs/promises';

interface SaveFileHistoryParams {
  userId: string | undefined;
  isGuest: boolean | undefined;
  originalFileName: string;
  processedFilePath: string;
  operation: string;
  fileSize: number;
  status?: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
}

export async function saveFileHistory({
  userId,
  isGuest,
  originalFileName,
  processedFilePath,
  operation,
  fileSize,
  status = 'completed',
  errorMessage,
}: SaveFileHistoryParams): Promise<void> {
  // Only save history for authenticated users
  if (!userId || isGuest) {
    return;
  }

  try {
    // Get just the filename from the full path
    const processedFileName = path.basename(processedFilePath);

    // Save file record
    await File.create({
      userId,
      originalFileName,
      processedFileName,
      operation,
      fileSize,
      status,
      errorMessage,
    });

    // Update usage statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Usage.findOneAndUpdate(
      {
        userId,
        date: today,
        operation,
      },
      {
        $inc: {
          fileCount: 1,
          totalFileSize: fileSize,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );
  } catch (error) {
    // Log error but don't fail the request
    console.error('Error saving file history:', error);
  }
}

