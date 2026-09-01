import fs from 'fs/promises';
import { PDFDocument } from 'pdf-lib';
import { AppError } from './errors';

/**
 * Loads a PDF and converts pdf-lib's terse failures into errors that tell the
 * user what is actually wrong with their file.
 */
export async function loadPdf(
  filePath: string,
  options: { ignoreEncryption?: boolean } = {}
): Promise<PDFDocument> {
  let bytes: Buffer;
  try {
    bytes = await fs.readFile(filePath);
  } catch {
    throw new AppError('CORRUPT_FILE', 'The uploaded file could not be read.');
  }

  if (bytes.length === 0) {
    throw new AppError('INVALID_INPUT', 'The uploaded file is empty.');
  }

  if (bytes.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new AppError(
      'UNSUPPORTED_FILE',
      'This file is not a PDF.',
      'Make sure you are uploading a .pdf file.'
    );
  }

  try {
    return await PDFDocument.load(bytes, {
      ignoreEncryption: options.ignoreEncryption ?? false,
      updateMetadata: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.toLowerCase().includes('encrypted')) {
      throw new AppError(
        'ENCRYPTED_FILE',
        'This PDF is password-protected.',
        'Unlock the PDF first, then upload it again.'
      );
    }

    throw new AppError(
      'CORRUPT_FILE',
      'This PDF appears to be damaged and could not be opened.',
      'Try re-exporting or repairing the file, then upload it again.'
    );
  }
}

export async function getPageCount(filePath: string): Promise<number> {
  const doc = await loadPdf(filePath, { ignoreEncryption: true });
  return doc.getPageCount();
}

export interface PageRange {
  start: number;
  end: number;
}

/**
 * Parses page selections such as "1-3, 5, 8-10" into validated ranges.
 * Accepts both the string form and the structured array the API also supports.
 */
export function parsePageRanges(
  input: string | PageRange[] | undefined,
  pageCount: number
): PageRange[] | undefined {
  if (!input) return undefined;

  const ranges: PageRange[] = [];

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return undefined;

    for (const part of trimmed.split(',')) {
      const chunk = part.trim();
      if (!chunk) continue;

      const match = chunk.match(/^(\d+)\s*(?:-\s*(\d+))?$/);
      if (!match) {
        throw new AppError(
          'INVALID_INPUT',
          `"${chunk}" is not a valid page selection.`,
          'Use a format like "1-3, 5, 8-10".'
        );
      }

      const start = Number(match[1]);
      const end = match[2] ? Number(match[2]) : start;
      ranges.push({ start, end });
    }
  } else {
    ranges.push(...input);
  }

  for (const range of ranges) {
    if (!Number.isInteger(range.start) || !Number.isInteger(range.end)) {
      throw new AppError('INVALID_INPUT', 'Page numbers must be whole numbers.');
    }
    if (range.start < 1 || range.end < range.start) {
      throw new AppError(
        'INVALID_INPUT',
        `Page range ${range.start}-${range.end} is not valid.`
      );
    }
    if (range.end > pageCount) {
      throw new AppError(
        'INVALID_INPUT',
        `This document has ${pageCount} page${pageCount === 1 ? '' : 's'}, so page ${range.end} does not exist.`
      );
    }
  }

  return ranges.length ? ranges : undefined;
}

/** Expands ranges into unique zero-based page indices, in order. */
export function rangesToIndices(ranges: PageRange[]): number[] {
  const seen = new Set<number>();
  const indices: number[] = [];

  for (const { start, end } of ranges) {
    for (let page = start; page <= end; page += 1) {
      const index = page - 1;
      if (!seen.has(index)) {
        seen.add(index);
        indices.push(index);
      }
    }
  }

  return indices;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
