import path from 'path';
import fs from 'fs/promises';
import { run } from '../../lib/exec';
import { getCapabilities } from '../../lib/binaries';
import * as poppler from './poppler';

/**
 * Local OCR. Running Tesseract on the server keeps scanned documents private
 * and removes the third-party API quota the previous implementation depended on.
 */

export async function isAvailable(): Promise<boolean> {
  const caps = await getCapabilities();
  return caps.tesseract && caps.poppler;
}

export interface OcrOptions {
  language?: string;
  /** Cap on pages processed, to bound runtime and memory. */
  maxPages?: number;
  dpi?: number;
}

/** OCRs a PDF by rasterizing pages and recognising each one. */
export async function ocrPdfToText(
  inputPath: string,
  workDir: string,
  options: OcrOptions = {}
): Promise<string> {
  const { language = 'eng', maxPages = 30, dpi = 200 } = options;

  const imageDir = path.join(workDir, 'ocr-pages');
  const images = await poppler.toImages(inputPath, imageDir, {
    dpi,
    lastPage: maxPages,
  });

  const pages: string[] = [];
  for (const image of images) {
    const { stdout } = await run(
      'tesseract',
      [image, 'stdout', '-l', language, '--psm', '3'],
      { timeoutMs: 120_000 }
    );
    pages.push(stdout.trim());
    await fs.unlink(image).catch(() => undefined);
  }

  return pages
    .map((text, index) => `--- Page ${index + 1} ---\n\n${text}`)
    .join('\n\n');
}

/**
 * Produces a searchable PDF: the original page image with an invisible text
 * layer behind it, so the document looks identical but can be selected
 * and searched.
 */
export async function ocrPdfToSearchablePdf(
  inputPath: string,
  outputPath: string,
  workDir: string,
  options: OcrOptions = {}
): Promise<void> {
  const { language = 'eng', maxPages = 30, dpi = 200 } = options;

  const imageDir = path.join(workDir, 'ocr-src');
  const images = await poppler.toImages(inputPath, imageDir, {
    dpi,
    lastPage: maxPages,
  });

  const pagePdfs: string[] = [];
  for (const [index, image] of images.entries()) {
    const base = path.join(workDir, `searchable-${index}`);
    await run('tesseract', [image, base, '-l', language, '--psm', '3', 'pdf'], {
      timeoutMs: 180_000,
    });
    pagePdfs.push(`${base}.pdf`);
  }

  if (pagePdfs.length === 1) {
    await fs.copyFile(pagePdfs[0], outputPath);
    return;
  }

  // Combine per-page PDFs with pdf-lib so no extra engine is required here.
  const { PDFDocument } = await import('@cantoo/pdf-lib');
  const merged = await PDFDocument.create();
  for (const pagePdf of pagePdfs) {
    const bytes = await fs.readFile(pagePdf);
    const doc = await PDFDocument.load(bytes);
    const copied = await merged.copyPages(doc, doc.getPageIndices());
    copied.forEach((page) => merged.addPage(page));
  }
  await fs.writeFile(outputPath, await merged.save());
}
