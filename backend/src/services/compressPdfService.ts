import fs from 'fs/promises';
import { PDFDocument } from 'pdf-lib';
import { AppError, toAppError } from '../lib/errors';
import { loadPdf } from '../lib/pdf';
import * as ghostscript from './engines/ghostscript';
import type { CompressionLevel } from './engines/ghostscript';

/**
 * PDF compression.
 *
 * The previous implementation copied pages into a new document and disabled
 * object streams, which usually made files *larger*. Real compression requires
 * re-encoding embedded images, which is what Ghostscript does here.
 *
 * The result is always compared against the original, and the original is kept
 * when it is already smaller — reporting an honest 0% instead of handing back
 * a bigger file.
 */

export type { CompressionLevel };

export interface CompressResult {
  outputPath: string;
  originalSize: number;
  compressedSize: number;
  /** Percentage saved, 0 when the file could not be reduced further. */
  savedPercent: number;
  engine: 'ghostscript' | 'javascript';
  alreadyOptimized: boolean;
}

export class CompressPdfService {
  static async compress(
    inputPath: string,
    outputPath: string,
    level: CompressionLevel = 'balanced'
  ): Promise<CompressResult> {
    await loadPdf(inputPath, { ignoreEncryption: false });

    const originalSize = (await fs.stat(inputPath)).size;
    let engine: CompressResult['engine'] = 'javascript';

    try {
      if (await ghostscript.isAvailable()) {
        await ghostscript.compress(inputPath, outputPath, level);
        engine = 'ghostscript';
      } else {
        await this.compressWithJavaScript(inputPath, outputPath);
      }
    } catch (error) {
      throw toAppError(error, 'The PDF could not be compressed.');
    }

    const compressedSize = (await fs.stat(outputPath)).size;

    // Never return a file bigger than what the user gave us.
    if (compressedSize >= originalSize) {
      await fs.copyFile(inputPath, outputPath);
      return {
        outputPath,
        originalSize,
        compressedSize: originalSize,
        savedPercent: 0,
        engine,
        alreadyOptimized: true,
      };
    }

    return {
      outputPath,
      originalSize,
      compressedSize,
      savedPercent: Math.round(((originalSize - compressedSize) / originalSize) * 100),
      engine,
      alreadyOptimized: false,
    };
  }

  /**
   * Without Ghostscript the only safe win is structural: object streams and
   * stripped metadata. Modest, but genuine, and never inflates the file.
   */
  private static async compressWithJavaScript(
    inputPath: string,
    outputPath: string
  ): Promise<void> {
    const source = await loadPdf(inputPath, { ignoreEncryption: true });

    const target = await PDFDocument.create();
    const pages = await target.copyPages(source, source.getPageIndices());
    pages.forEach((page) => target.addPage(page));

    target.setTitle('');
    target.setAuthor('');
    target.setSubject('');
    target.setKeywords([]);
    target.setProducer('Mypdftools');
    target.setCreator('Mypdftools');

    const bytes = await target.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    if (bytes.length === 0) {
      throw new AppError('PROCESSING_FAILED', 'Compression produced an empty file.');
    }

    await fs.writeFile(outputPath, bytes);
  }
}
