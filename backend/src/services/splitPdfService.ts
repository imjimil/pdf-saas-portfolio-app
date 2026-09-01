import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import archiver from 'archiver';
import { PDFDocument } from '@cantoo/pdf-lib';
import { AppError, toAppError } from '../lib/errors';
import { loadPdf, parsePageRanges, rangesToIndices, PageRange } from '../lib/pdf';

/**
 * Split PDF.
 *
 * Three modes:
 *   ranges  - extract selected pages into one PDF
 *   all     - one PDF per page, delivered as a ZIP
 *   every-n - fixed-size chunks, delivered as a ZIP
 *
 * The previous version created one file per page but the route only ever sent
 * the first one, so users silently received page 1 alone.
 */

export type SplitMode = 'ranges' | 'all' | 'every-n';

export interface SplitOptions {
  mode: SplitMode;
  /** For 'ranges': "1-3, 7, 10-12" or structured ranges. */
  pageRanges?: string | PageRange[];
  /** For 'every-n': pages per output document. */
  chunkSize?: number;
}

export interface SplitResult {
  /** Single PDF, or a ZIP when the split produced multiple documents. */
  outputPath: string;
  fileName: string;
  isArchive: boolean;
  documentCount: number;
  pageCount: number;
}

export class SplitPdfService {
  static async split(
    inputPath: string,
    outputDir: string,
    baseName: string,
    options: SplitOptions
  ): Promise<SplitResult> {
    try {
      const source = await loadPdf(inputPath, { ignoreEncryption: false });
      const pageCount = source.getPageCount();

      if (pageCount === 0) {
        throw new AppError('EMPTY_RESULT', 'This PDF has no pages.');
      }

      await fs.mkdir(outputDir, { recursive: true });
      const stem = path.basename(baseName, path.extname(baseName));

      if (options.mode === 'ranges') {
        return await this.extractRanges(source, outputDir, stem, options, pageCount);
      }

      if (options.mode === 'every-n') {
        return await this.splitIntoChunks(source, outputDir, stem, options, pageCount);
      }

      return await this.splitEveryPage(source, outputDir, stem, pageCount);
    } catch (error) {
      throw toAppError(error, 'The PDF could not be split.');
    }
  }

  private static async extractRanges(
    source: PDFDocument,
    outputDir: string,
    stem: string,
    options: SplitOptions,
    pageCount: number
  ): Promise<SplitResult> {
    const ranges = parsePageRanges(options.pageRanges, pageCount);

    if (!ranges?.length) {
      throw new AppError(
        'INVALID_INPUT',
        'Select which pages you want to extract.',
        'For example: 1-3, 7, 10-12'
      );
    }

    const indices = rangesToIndices(ranges);
    const target = await PDFDocument.create();
    const copied = await target.copyPages(source, indices);
    copied.forEach((page) => target.addPage(page));

    const fileName = `${stem}_pages.pdf`;
    const outputPath = path.join(outputDir, fileName);
    await fs.writeFile(outputPath, await target.save());

    return {
      outputPath,
      fileName,
      isArchive: false,
      documentCount: 1,
      pageCount: indices.length,
    };
  }

  private static async splitEveryPage(
    source: PDFDocument,
    outputDir: string,
    stem: string,
    pageCount: number
  ): Promise<SplitResult> {
    const pagesDir = path.join(outputDir, 'pages');
    await fs.mkdir(pagesDir, { recursive: true });

    const width = String(pageCount).length;

    for (let index = 0; index < pageCount; index += 1) {
      const target = await PDFDocument.create();
      const [page] = await target.copyPages(source, [index]);
      target.addPage(page);

      const label = String(index + 1).padStart(width, '0');
      await fs.writeFile(
        path.join(pagesDir, `${stem}_page_${label}.pdf`),
        await target.save()
      );
    }

    const fileName = `${stem}_split.zip`;
    const outputPath = path.join(outputDir, fileName);
    await zipDirectory(pagesDir, outputPath);

    return {
      outputPath,
      fileName,
      isArchive: true,
      documentCount: pageCount,
      pageCount,
    };
  }

  private static async splitIntoChunks(
    source: PDFDocument,
    outputDir: string,
    stem: string,
    options: SplitOptions,
    pageCount: number
  ): Promise<SplitResult> {
    const chunkSize = Math.floor(options.chunkSize ?? 1);

    if (!Number.isFinite(chunkSize) || chunkSize < 1) {
      throw new AppError('INVALID_INPUT', 'Pages per file must be at least 1.');
    }

    if (chunkSize >= pageCount) {
      throw new AppError(
        'INVALID_INPUT',
        `This document only has ${pageCount} pages, so splitting every ${chunkSize} pages would produce a single file.`
      );
    }

    const chunksDir = path.join(outputDir, 'chunks');
    await fs.mkdir(chunksDir, { recursive: true });

    let documentCount = 0;
    for (let start = 0; start < pageCount; start += chunkSize) {
      const indices = Array.from(
        { length: Math.min(chunkSize, pageCount - start) },
        (_, offset) => start + offset
      );

      const target = await PDFDocument.create();
      const copied = await target.copyPages(source, indices);
      copied.forEach((page) => target.addPage(page));

      documentCount += 1;
      const first = start + 1;
      const last = start + indices.length;
      await fs.writeFile(
        path.join(chunksDir, `${stem}_${first}-${last}.pdf`),
        await target.save()
      );
    }

    const fileName = `${stem}_split.zip`;
    const outputPath = path.join(outputDir, fileName);
    await zipDirectory(chunksDir, outputPath);

    return { outputPath, fileName, isArchive: true, documentCount, pageCount };
  }
}

function zipDirectory(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fsSync.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    output.on('error', reject);
    archive.on('error', reject);
    archive.on('warning', (warning) => {
      if (warning.code !== 'ENOENT') reject(warning);
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    void archive.finalize();
  });
}
