import File from '../models/File';
import Usage from '../models/Usage';
import type { Operation } from '../lib/operations';

/**
 * Activity history.
 *
 * This records *metadata only*. Processed files are streamed to the user and
 * then deleted — they are never retained on the server. That matches the
 * privacy promise on the site, and is the only correct model on a host with an
 * ephemeral filesystem, where kept files would vanish on the next deploy and
 * leave the history pointing at 404s.
 */

interface RecordActivityParams {
  userId?: string;
  isGuest?: boolean;
  originalFileName: string;
  resultFileName: string;
  operation: Operation;
  fileSize: number;
}

export async function recordActivity({
  userId,
  isGuest,
  originalFileName,
  resultFileName,
  operation,
  fileSize,
}: RecordActivityParams): Promise<void> {
  // Guests are anonymous by design; there is nothing to attribute a record to.
  if (!userId || isGuest) return;

  try {
    await File.create({
      userId,
      originalFileName,
      processedFileName: resultFileName,
      operation,
      fileSize,
      status: 'completed',
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Usage.findOneAndUpdate(
      { userId, date: today, operation },
      { $inc: { fileCount: 1, totalFileSize: fileSize } },
      { upsert: true, new: true }
    );
  } catch (error) {
    // History is a convenience; never fail a completed conversion because of it.
    console.error('Failed to record activity:', error);
  }
}
