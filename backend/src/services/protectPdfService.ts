import fs from 'fs/promises';
import { AppError, toAppError } from '../lib/errors';
import { loadPdf } from '../lib/pdf';
import * as qpdf from './engines/qpdf';

/**
 * Password-protect a PDF with AES-256 encryption.
 *
 * Requires qpdf. There is deliberately no JavaScript fallback: pdf-lib cannot
 * encrypt, and silently returning an unencrypted file for a security feature
 * would be worse than a clear error.
 */

export interface ProtectOptions {
  ownerPassword?: string;
  allowPrinting?: boolean | 'low';
  allowModifying?: boolean;
  allowCopying?: boolean;
  allowAnnotating?: boolean;
}

export interface ProtectResult {
  outputPath: string;
  encryption: 'AES-256';
}

const MIN_PASSWORD_LENGTH = 4;

export class ProtectPdfService {
  static async protect(
    inputPath: string,
    outputPath: string,
    password: string,
    options: ProtectOptions = {}
  ): Promise<ProtectResult> {
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      throw new AppError(
        'INVALID_INPUT',
        `The password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      );
    }

    if (!(await qpdf.isAvailable())) {
      throw new AppError(
        'ENGINE_UNAVAILABLE',
        'PDF password protection is not available in this environment.',
        'This feature runs on the deployed server, which has the encryption engine installed.'
      );
    }

    await loadPdf(inputPath, { ignoreEncryption: false });

    try {
      await qpdf.encrypt(
        inputPath,
        outputPath,
        password,
        options.ownerPassword || password,
        {
          printing: options.allowPrinting ?? true,
          modifying: options.allowModifying ?? false,
          copying: options.allowCopying ?? false,
          annotating: options.allowAnnotating ?? false,
        }
      );
    } catch (error) {
      throw toAppError(error, 'The PDF could not be password-protected.');
    }

    const stat = await fs.stat(outputPath).catch(() => null);
    if (!stat || stat.size === 0) {
      throw new AppError('PROCESSING_FAILED', 'Encryption produced an empty file.');
    }

    return { outputPath, encryption: 'AES-256' };
  }

  /** Removes a known password from a PDF. */
  static async unlock(
    inputPath: string,
    outputPath: string,
    password: string
  ): Promise<{ outputPath: string }> {
    if (!(await qpdf.isAvailable())) {
      throw new AppError(
        'ENGINE_UNAVAILABLE',
        'PDF unlocking is not available in this environment.'
      );
    }

    if (!password) {
      throw new AppError('INVALID_INPUT', 'Enter the PDF password.');
    }

    await qpdf.decrypt(inputPath, outputPath, password);
    return { outputPath };
  }
}
