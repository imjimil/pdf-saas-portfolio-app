import fs from 'fs/promises';
import { PDFDocument } from '@cantoo/pdf-lib';
import { AppError, toAppError } from '../lib/errors';
import { loadPdf } from '../lib/pdf';

/**
 * Merge PDFs in the order supplied.
 *
 * Failures now name the specific file that caused them, so a user merging ten
 * documents is not left guessing which one is encrypted or damaged.
 */

export interface MergeInput {
  path: string;
  originalName: string;
}

export interface MergeResult {
  outputPath: string;
  pageCount: number;
  documentCount: number;
}

export class MergePdfService {
  static async merge(
    inputs: MergeInput[],
    outputPath: string
  ): Promise<MergeResult> {
    if (inputs.length < 2) {
      throw new AppError('INVALID_INPUT', 'Select at least two PDFs to merge.');
    }

    const merged = await PDFDocument.create();

    for (const input of inputs) {
      let source: PDFDocument;
      try {
        source = await loadPdf(input.path, { ignoreEncryption: false });
      } catch (error) {
        const reason = error instanceof AppError ? error.message : 'could not be opened';
        throw new AppError(
          error instanceof AppError ? error.code : 'CORRUPT_FILE',
          `"${input.originalName}" ${reason.charAt(0).toLowerCase()}${reason.slice(1)}`,
          error instanceof AppError ? error.hint : undefined
        );
      }

      if (source.getPageCount() === 0) {
        throw new AppError('EMPTY_RESULT', `"${input.originalName}" has no pages.`);
      }

      try {
        const copied = await merged.copyPages(source, source.getPageIndices());
        copied.forEach((page) => merged.addPage(page));
      } catch (error) {
        throw toAppError(error, `"${input.originalName}" could not be merged.`);
      }
    }

    merged.setProducer('Mypdftools');
    merged.setCreator('Mypdftools');

    await fs.writeFile(outputPath, await merged.save({ useObjectStreams: true }));

    return {
      outputPath,
      pageCount: merged.getPageCount(),
      documentCount: inputs.length,
    };
  }
}
