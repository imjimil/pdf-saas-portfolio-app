import fs from 'fs/promises';
import { AppError } from './errors';

/**
 * Text extraction backed by Mozilla's PDF.js.
 *
 * This replaces pdf-parse, which bundles a 2017 build of PDF.js and fails with
 * "Invalid PDF structure" on documents produced by any modern writer.
 *
 * PDF.js ships as ESM, so it is imported dynamically and cached.
 */

/**
 * Only the small slice of the PDF.js API used here is typed, which avoids
 * importing ESM type declarations into this CommonJS build.
 */
interface TextItem {
  str: string;
  width?: number;
  transform: number[];
}

interface PdfPage {
  getTextContent(): Promise<{ items: Array<TextItem | object> }>;
  cleanup(): void;
}

interface PdfDocument {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPage>;
  destroy(): Promise<void>;
}

interface PdfjsModule {
  getDocument(options: Record<string, unknown>): { promise: Promise<PdfDocument> };
}

let pdfjsPromise: Promise<PdfjsModule> | null = null;

async function loadPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs') as unknown as Promise<PdfjsModule>;
  }
  return pdfjsPromise;
}

export interface ExtractedText {
  text: string;
  pages: string[];
  pageCount: number;
}

/**
 * Extracts text page by page, reinserting the line breaks PDF.js drops.
 *
 * A PDF has no concept of lines — only glyphs at coordinates — so vertical
 * position changes are used to decide where one line ends and the next begins.
 */
export async function extractText(
  filePath: string,
  options: { maxPages?: number } = {}
): Promise<ExtractedText> {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await fs.readFile(filePath));

  let document;
  try {
    document = await pdfjs.getDocument({
      data,
      // Server-side rendering needs neither fonts nor worker threads.
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
      verbosity: 0,
    }).promise;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/password/i.test(message)) {
      throw new AppError(
        'ENCRYPTED_FILE',
        'This PDF is password-protected.',
        'Unlock the PDF first, then upload it again.'
      );
    }
    throw new AppError('CORRUPT_FILE', 'This PDF could not be read.');
  }

  const limit = Math.min(document.numPages, options.maxPages ?? document.numPages);
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= limit; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();

    let text = '';
    let previousY: number | null = null;
    let previousEndX: number | null = null;

    for (const item of content.items) {
      if (!('str' in item)) continue;

      const [, , , , x, y] = item.transform as number[];
      const width = item.width ?? 0;

      if (previousY !== null && Math.abs(y - previousY) > 2) {
        // A new baseline means a new line; a large jump means a new paragraph.
        text += Math.abs(y - previousY) > 14 ? '\n\n' : '\n';
      } else if (
        previousEndX !== null &&
        x - previousEndX > 1 &&
        !text.endsWith(' ')
      ) {
        text += ' ';
      }

      text += item.str;

      previousY = y;
      previousEndX = x + width;
    }

    pages.push(text.trim());
    page.cleanup();
  }

  await document.destroy();

  return {
    text: pages.join('\n\n'),
    pages,
    pageCount: document.numPages,
  };
}

/** Page count without extracting any text. */
export async function getPageCount(filePath: string): Promise<number> {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await fs.readFile(filePath));
  const document = await pdfjs.getDocument({ data, verbosity: 0 }).promise;
  const count = document.numPages;
  await document.destroy();
  return count;
}
