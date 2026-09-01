import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { WORKSPACE_ROOT } from '../lib/workspace';
import { AppError } from '../lib/errors';

/**
 * Upload handling.
 *
 * Files land in the OS temp tree (not the app directory) so nothing persists
 * across restarts and Render's ephemeral disk never fills with orphaned files.
 */

export const MAX_UPLOAD_BYTES =
  Number(process.env.MAX_UPLOAD_MB || 50) * 1024 * 1024;

const INCOMING_DIR = path.join(WORKSPACE_ROOT, 'incoming');

export const ACCEPTED = {
  pdf: ['application/pdf'],
  image: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/tiff',
    'image/bmp',
    'image/avif',
    'image/heic',
    'image/heif',
  ],
  word: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.oasis.opendocument.text',
    'application/rtf',
    'text/rtf',
  ],
} as const;

const EXTENSIONS: Record<keyof typeof ACCEPTED, string[]> = {
  pdf: ['.pdf'],
  image: [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.tif', '.tiff', '.bmp', '.avif', '.heic', '.heif',
  ],
  word: ['.docx', '.doc', '.odt', '.rtf'],
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdir(INCOMING_DIR, { recursive: true })
      .then(() => cb(null, INCOMING_DIR))
      .catch((error) => cb(error, INCOMING_DIR));
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    // Never trust the client filename on disk; the original is kept in memory
    // for the download name only.
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase().slice(0, 10)}`);
  },
});

/**
 * Accepts a file when either its MIME type or its extension matches.
 * Browsers report inconsistent MIME types for .docx and HEIC in particular.
 */
function makeFilter(kinds: Array<keyof typeof ACCEPTED>) {
  const mimes = new Set(kinds.flatMap((kind) => [...ACCEPTED[kind]] as string[]));
  const extensions = new Set(kinds.flatMap((kind) => EXTENSIONS[kind]));

  const label = kinds
    .map((kind) =>
      kind === 'pdf' ? 'PDF' : kind === 'word' ? 'Word document' : 'image'
    )
    .join(' or ');

  return (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (mimes.has(file.mimetype) || extensions.has(extension)) {
      cb(null, true);
      return;
    }
    cb(
      new AppError(
        'UNSUPPORTED_FILE',
        `"${file.originalname}" is not a supported file type.`,
        `Upload a ${label} file.`
      )
    );
  };
}

export function uploader(
  kinds: Array<keyof typeof ACCEPTED>,
  maxFiles = 1
): multer.Multer {
  return multer({
    storage,
    limits: { fileSize: MAX_UPLOAD_BYTES, files: maxFiles },
    fileFilter: makeFilter(kinds),
  });
}

/** Translates multer's error codes into user-facing messages. */
export function normalizeUploadError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return new AppError(
          'TOO_LARGE',
          `That file is larger than the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB limit.`,
          'Try compressing the PDF first, or split it into smaller parts.'
        );
      case 'LIMIT_FILE_COUNT':
      case 'LIMIT_UNEXPECTED_FILE':
        return new AppError('INVALID_INPUT', 'Too many files were uploaded at once.');
      default:
        return new AppError('INVALID_INPUT', error.message);
    }
  }

  return new AppError(
    'INVALID_INPUT',
    error instanceof Error ? error.message : 'The upload failed.'
  );
}
