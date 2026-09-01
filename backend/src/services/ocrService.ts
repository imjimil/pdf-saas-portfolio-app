import fs from 'fs/promises';
import path from 'path';
import { AppError, toAppError } from '../lib/errors';
import { loadPdf } from '../lib/pdf';
import { extractText } from '../lib/pdfText';
import * as poppler from './engines/poppler';
import * as tesseract from './engines/tesseract';

/**
 * OCR for scanned PDFs.
 *
 * Tesseract runs locally, so documents no longer have to be uploaded to a
 * third-party API and there is no external quota. OCR.space remains as an
 * optional fallback when Tesseract is unavailable and a key is configured.
 */

export interface OcrResult {
  text: string;
  characterCount: number;
  wordCount: number;
  /** How the text was obtained. */
  source: 'embedded-text' | 'ocr-local' | 'ocr-cloud';
  pagesProcessed?: number;
}

export interface SearchablePdfResult {
  outputPath: string;
  text: string;
}

/** Below this, a PDF is treated as scanned rather than text-based. */
const MEANINGFUL_TEXT_THRESHOLD = 80;

export class OCRService {
  /**
   * Returns the document's text, running OCR only when the PDF has no usable
   * embedded text layer.
   */
  static async extractText(
    inputPath: string,
    workDir: string,
    options: { language?: string; maxPages?: number } = {}
  ): Promise<OcrResult> {
    await loadPdf(inputPath, { ignoreEncryption: false });

    const embedded = await this.readEmbeddedText(inputPath);
    if (embedded.trim().length >= MEANINGFUL_TEXT_THRESHOLD) {
      return {
        text: embedded.trim(),
        characterCount: embedded.trim().length,
        wordCount: countWords(embedded),
        source: 'embedded-text',
      };
    }

    if (await tesseract.isAvailable()) {
      const text = await tesseract.ocrPdfToText(inputPath, workDir, {
        language: options.language ?? 'eng',
        maxPages: options.maxPages ?? 30,
      });

      if (text.replace(/--- Page \d+ ---/g, '').trim()) {
        return {
          text: text.trim(),
          characterCount: text.trim().length,
          wordCount: countWords(text),
          source: 'ocr-local',
        };
      }
    }

    const cloud = await this.tryCloudOcr(inputPath);
    if (cloud) {
      return {
        text: cloud,
        characterCount: cloud.length,
        wordCount: countWords(cloud),
        source: 'ocr-cloud',
      };
    }

    if (embedded.trim()) {
      return {
        text: embedded.trim(),
        characterCount: embedded.trim().length,
        wordCount: countWords(embedded),
        source: 'embedded-text',
      };
    }

    throw new AppError(
      'EMPTY_RESULT',
      'No text could be read from this document.',
      'The pages may be blank, very low resolution, or in a language the recogniser does not support.'
    );
  }

  /**
   * Produces a PDF that looks identical to the original but has an invisible,
   * selectable text layer behind each page.
   */
  static async createSearchablePdf(
    inputPath: string,
    outputPath: string,
    workDir: string,
    options: { language?: string; maxPages?: number } = {}
  ): Promise<SearchablePdfResult> {
    await loadPdf(inputPath, { ignoreEncryption: false });

    if (!(await tesseract.isAvailable())) {
      throw new AppError(
        'ENGINE_UNAVAILABLE',
        'Searchable PDF creation is not available in this environment.',
        'This feature runs on the deployed server, which has the OCR engine installed.'
      );
    }

    try {
      await tesseract.ocrPdfToSearchablePdf(inputPath, outputPath, workDir, {
        language: options.language ?? 'eng',
        maxPages: options.maxPages ?? 30,
      });
    } catch (error) {
      throw toAppError(error, 'The searchable PDF could not be created.');
    }

    const stat = await fs.stat(outputPath).catch(() => null);
    if (!stat || stat.size === 0) {
      throw new AppError('PROCESSING_FAILED', 'The searchable PDF came out empty.');
    }

    const text = await this.readEmbeddedText(outputPath);
    return { outputPath, text: text.trim() };
  }

  private static async readEmbeddedText(inputPath: string): Promise<string> {
    if (await poppler.isAvailable()) {
      try {
        return await poppler.toText(inputPath, { layout: true });
      } catch {
        // Fall through to pdf-parse.
      }
    }

    try {
      return (await extractText(inputPath)).text;
    } catch {
      return '';
    }
  }

  /** Optional OCR.space fallback, used only when a key is configured. */
  private static async tryCloudOcr(inputPath: string): Promise<string | null> {
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) return null;

    try {
      const { ocrSpace } = await import('ocr-space-api-wrapper');
      const response: any = await ocrSpace(inputPath, {
        apiKey,
        language: 'eng',
        isOverlayRequired: false,
        OCREngine: '2',
        filetype: path.extname(inputPath).replace('.', '').toUpperCase() || 'PDF',
      });

      const text = (response?.ParsedResults ?? [])
        .map((result: any) => result?.ParsedText ?? '')
        .join('\n')
        .trim();

      return text || null;
    } catch (error) {
      console.warn(
        'Cloud OCR fallback failed:',
        error instanceof Error ? error.message : error
      );
      return null;
    }
  }
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
