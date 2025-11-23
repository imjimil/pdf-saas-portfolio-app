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
}: SaveFileHistoryParams): Promise<any> {
  try {
    // Get just the filename from the full path
    const processedFileName = path.basename(processedFilePath);

    // Save file record for both guests and authenticated users
    // This allows downloads to work via file ID
    const savedFile = await File.create({
      userId: userId || undefined, // Allow null for guests
      originalFileName,
      processedFileName,
      operation,
      fileSize,
      status,
      errorMessage,
    });
    
    // Only update usage statistics for authenticated users
    if (userId && !isGuest) {
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
    }
    
    return savedFile;
  } catch (error) {
    // Log error but don't fail the request
    console.error('Error saving file history:', error);
    return null;
  }
}

