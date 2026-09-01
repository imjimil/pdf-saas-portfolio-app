import fs from 'fs/promises';
import { AppError, toAppError } from '../lib/errors';
import { loadPdf } from '../lib/pdf';
import { extractText } from '../lib/pdfText';
import * as poppler from './engines/poppler';

/**
 * PDF to plain text.
 *
 * Poppler's layout mode keeps columns and tabular alignment intact; pdf-parse
 * is the fallback. An image-only PDF now returns a clear error pointing at the
 * OCR tool, instead of writing "No text content found" into a file and calling
 * it a successful conversion.
 */

export interface PdfToTxtOptions {
  /** Preserve visual column layout. */
  layout?: boolean;
  includePageMarkers?: boolean;
}

export interface PdfToTxtResult {
  outputPath: string;
  characterCount: number;
  wordCount: number;
}

export class PdfToTxtService {
  static async convert(
    inputPath: string,
    outputPath: string,
    options: PdfToTxtOptions = {}
  ): Promise<PdfToTxtResult> {
    const { layout = true, includePageMarkers = false } = options;

    try {
      const pdf = await loadPdf(inputPath, { ignoreEncryption: false });
      const pageCount = pdf.getPageCount();

      let text = '';

      if (await poppler.isAvailable()) {
        if (includePageMarkers) {
          const pages: string[] = [];
          for (let page = 1; page <= pageCount; page += 1) {
            const pageText = await poppler.toText(inputPath, {
              layout,
              firstPage: page,
              lastPage: page,
            });
            pages.push(`--- Page ${page} ---\n\n${pageText.trim()}`);
          }
          text = pages.join('\n\n');
        } else {
          text = await poppler.toText(inputPath, { layout });
        }
      } else {
        const extracted = await extractText(inputPath);
        text = includePageMarkers
          ? extracted.pages
              .map((page, index) => `--- Page ${index + 1} ---\n\n${page}`)
              .join('\n\n')
          : extracted.text;
      }

      const normalized = text.replace(/\r\n/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();

      if (!normalized) {
        throw new AppError(
          'EMPTY_RESULT',
          'This PDF contains no selectable text.',
          'It looks like a scanned document — use the PDF OCR tool to read the text from the page images.'
        );
      }

      await fs.writeFile(outputPath, normalized, 'utf-8');

      return {
        outputPath,
        characterCount: normalized.length,
        wordCount: normalized.split(/\s+/).filter(Boolean).length,
      };
    } catch (error) {
      throw toAppError(error, 'Text could not be extracted from this PDF.');
    }
  }
}
