import fs from 'fs/promises';
import { PDFDocument } from '@cantoo/pdf-lib';
import { AppError, toAppError } from '../lib/errors';
import { loadPdf } from '../lib/pdf';
import * as qpdf from './engines/qpdf';

/**
 * Password-protect and unlock PDFs.
 *
 * Uses qpdf when the binary is installed (Docker deployments). On Render's
 * plain Node runtime we fall back to @cantoo/pdf-lib, which implements
 * AES-256 encryption without any system dependencies.
 */

export interface ProtectOptions {
  ownerPassword?: string;
  allowPrinting?: boolean | 'low';
  allowCopying?: boolean;
  allowModifying?: boolean;
  allowAnnotating?: boolean;
}

export interface ProtectResult {
  outputPath: string;
  encryption: 'AES-256';
  engine: 'qpdf' | 'javascript';
}

const MIN_PASSWORD_LENGTH = 4;

function printingPermission(
  allow?: boolean | 'low'
): boolean | 'lowResolution' | 'highResolution' {
  if (allow === 'low') return 'lowResolution';
  if (allow === false) return false;
  return 'highResolution';
}

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

    await loadPdf(inputPath, { ignoreEncryption: false });

    if (await qpdf.isAvailable()) {
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
        await assertNonEmpty(outputPath);
        return { outputPath, encryption: 'AES-256', engine: 'qpdf' };
      } catch (error) {
        throw toAppError(error, 'The PDF could not be password-protected.');
      }
    }

    try {
      const bytes = await fs.readFile(inputPath);
      const doc = await PDFDocument.load(bytes, { updateMetadata: false });
      doc.encrypt({
        userPassword: password,
        ownerPassword: options.ownerPassword || password,
        permissions: {
          printing: printingPermission(options.allowPrinting),
          modifying: options.allowModifying ?? false,
          copying: options.allowCopying ?? false,
          annotating: options.allowAnnotating ?? false,
        },
      });
      await fs.writeFile(outputPath, await doc.save());
      await assertNonEmpty(outputPath);
      return { outputPath, encryption: 'AES-256', engine: 'javascript' };
    } catch (error) {
      throw toAppError(error, 'The PDF could not be password-protected.');
    }
  }

  /** Removes a known password from a PDF. */
  static async unlock(
    inputPath: string,
    outputPath: string,
    password: string
  ): Promise<{ outputPath: string; engine: 'qpdf' | 'javascript' }> {
    if (!password) {
      throw new AppError('INVALID_INPUT', 'Enter the PDF password.');
    }

    if (await qpdf.isAvailable()) {
      await qpdf.decrypt(inputPath, outputPath, password);
      return { outputPath, engine: 'qpdf' };
    }

    try {
      const bytes = await fs.readFile(inputPath);
      const doc = await PDFDocument.load(bytes, { password, updateMetadata: false });
      await fs.writeFile(outputPath, await doc.save());
      await assertNonEmpty(outputPath);
      return { outputPath, engine: 'javascript' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/password|encrypt/i.test(message)) {
        throw new AppError(
          'INVALID_INPUT',
          'That password did not unlock the PDF.',
          'Check for typos and try again.'
        );
      }
      throw toAppError(error, 'The PDF could not be unlocked.');
    }
  }
}

async function assertNonEmpty(outputPath: string): Promise<void> {
  const stat = await fs.stat(outputPath).catch(() => null);
  if (!stat || stat.size === 0) {
    throw new AppError('PROCESSING_FAILED', 'Encryption produced an empty file.');
  }
}
