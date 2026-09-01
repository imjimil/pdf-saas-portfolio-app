/**
 * Typed errors so routes can map failures to accurate HTTP status codes and
 * messages the user can act on, instead of a blanket 500.
 */
export type AppErrorCode =
  | 'INVALID_INPUT'
  | 'UNSUPPORTED_FILE'
  | 'CORRUPT_FILE'
  | 'ENCRYPTED_FILE'
  | 'EMPTY_RESULT'
  | 'ENGINE_UNAVAILABLE'
  | 'TIMEOUT'
  | 'TOO_LARGE'
  | 'PROCESSING_FAILED';

const STATUS_BY_CODE: Record<AppErrorCode, number> = {
  INVALID_INPUT: 400,
  UNSUPPORTED_FILE: 415,
  CORRUPT_FILE: 422,
  ENCRYPTED_FILE: 422,
  EMPTY_RESULT: 422,
  ENGINE_UNAVAILABLE: 503,
  TIMEOUT: 504,
  TOO_LARGE: 413,
  PROCESSING_FAILED: 500,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly statusCode: number;
  readonly hint?: string;

  constructor(code: AppErrorCode, message: string, hint?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = STATUS_BY_CODE[code];
    this.hint = hint;
    Error.captureStackTrace?.(this, AppError);
  }

  toJSON() {
    return { code: this.code, message: this.message, hint: this.hint };
  }
}

export const isAppError = (error: unknown): error is AppError =>
  error instanceof AppError;

/**
 * Maps low-level library/engine failures onto user-facing errors. Raw messages
 * from pdf-lib, Ghostscript and friends are meaningless to end users.
 */
export function toAppError(error: unknown, fallbackMessage: string): AppError {
  if (isAppError(error)) return error;

  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (lower.includes('encrypted') || lower.includes('password')) {
    return new AppError(
      'ENCRYPTED_FILE',
      'This PDF is password-protected, so it cannot be processed.',
      'Remove the password from the PDF and upload it again.'
    );
  }

  if (
    lower.includes('invalid pdf') ||
    lower.includes('no pdf header') ||
    lower.includes('failed to parse') ||
    lower.includes('malformed')
  ) {
    return new AppError(
      'CORRUPT_FILE',
      'This file is not a valid PDF or is damaged.',
      'Try re-saving or re-exporting the document, then upload it again.'
    );
  }

  if (lower.includes('timed out') || lower.includes('etimedout')) {
    return new AppError(
      'TIMEOUT',
      'The document took too long to process.',
      'Try a smaller file, or split it into parts first.'
    );
  }

  return new AppError('PROCESSING_FAILED', fallbackMessage);
}
