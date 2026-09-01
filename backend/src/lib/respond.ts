import { Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { AppError, isAppError } from './errors';

/**
 * Response helpers shared by every tool route.
 */

const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain; charset=utf-8',
  '.epub': 'application/epub+zip',
  '.zip': 'application/zip',
};

/**
 * Streams a result file and resolves once the transfer finishes, so the caller
 * can safely delete the workspace afterwards.
 */
export function sendFile(
  res: Response,
  filePath: string,
  downloadName: string,
  meta: Record<string, string | number | boolean> = {}
): Promise<void> {
  return new Promise((resolve) => {
    const extension = path.extname(downloadName).toLowerCase();

    res.type(CONTENT_TYPES[extension] ?? 'application/octet-stream');

    // A single URI-encoded JSON header, because HTTP lowercases header names
    // and would otherwise mangle camelCase keys like `savedPercent`.
    res.setHeader('X-Result-Meta', encodeURIComponent(JSON.stringify(meta)));
    res.setHeader(
      'Access-Control-Expose-Headers',
      'X-Result-Meta, Content-Disposition'
    );

    res.download(filePath, sanitizeFilename(downloadName), (error) => {
      if (error && !res.headersSent) {
        console.error('Download failed:', error.message);
      }
      resolve();
    });
  });
}

/** Strips path separators and control characters from a download name. */
export function sanitizeFilename(name: string): string {
  const base = path.basename(name).replace(/[\x00-\x1f\x7f"\\/:*?<>|]/g, '');
  const trimmed = base.trim() || 'download';
  return trimmed.length > 180 ? trimmed.slice(-180) : trimmed;
}

/** Replaces a filename's extension, e.g. report.pdf -> report.docx */
export function withExtension(name: string, extension: string): string {
  const base = path.basename(name, path.extname(name));
  return `${base || 'document'}${extension}`;
}

export function sendError(res: Response, error: unknown, context: string): void {
  if (res.headersSent) {
    console.error(`${context} failed after response started:`, error);
    return;
  }

  if (isAppError(error)) {
    if (error.statusCode >= 500) {
      console.error(`${context}:`, error.message);
    }
    res.status(error.statusCode).json({
      message: error.message,
      hint: error.hint,
      code: error.code,
    });
    return;
  }

  console.error(`${context}:`, error);
  res.status(500).json({
    message: 'Something went wrong while processing your file. Please try again.',
    code: 'PROCESSING_FAILED',
  });
}

export async function fileSize(filePath: string): Promise<number> {
  const stat = await fs.stat(filePath).catch(() => null);
  return stat?.size ?? 0;
}

export { AppError };
